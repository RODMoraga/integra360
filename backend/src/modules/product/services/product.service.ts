import { Prisma } from "@prisma/client";
import { prisma } from "../../../database/prisma/client.js";
import type { ListProductsQuery } from "../dto/product.schema.js";

type ProductRow = {
  id: bigint | number;
  sku: string;
  name: string;
  description: string | null;
  categoryId: bigint | number | null;
  categoryName: string | null;
  brandId: bigint | number | null;
  brandName: string | null;
  price: number;
  stockAvailable: number;
  imageUrl: string | null;
};

type FilterRow = {
  id: bigint | number;
  name: string;
};

/**
 * Converts a `bigint` or `number` value to a plain `number`.
 * Returns `null` when the input is `null`.
 *
 * @param value - The value to convert.
 */
function toNumber(value: bigint | number | null): number | null {
  if (value === null) return null;
  return typeof value === "bigint" ? Number(value) : value;
}

/**
 * Builds the parameterised SQL `WHERE` clause for the product list query.
 * Always filters by `company_id`, `is_active`, and `deleted_at`.
 * Optionally adds full-text search on `sku`, `name`, and `description`,
 * as well as category/brand ID filters.
 *
 * @param companyId - Tenant company identifier.
 * @param query     - Validated query parameters from the HTTP request.
 * @returns A Prisma SQL fragment starting with `WHERE`.
 */
function buildProductWhere(companyId: number, query: ListProductsQuery): Prisma.Sql {
  const clauses: Prisma.Sql[] = [
    Prisma.sql`p.company_id = ${companyId}`,
    Prisma.sql`p.is_active = 1`,
    Prisma.sql`p.deleted_at IS NULL`
  ];

  const normalizedQ = query.q.trim().toLowerCase();
  if (normalizedQ) {
    const likeTerm = `%${normalizedQ}%`;
    clauses.push(
      Prisma.sql`(
        LOWER(p.sku) LIKE ${likeTerm}
        OR LOWER(p.name) LIKE ${likeTerm}
        OR LOWER(COALESCE(p.description, '')) LIKE ${likeTerm}
      )`
    );
  }

  if (query.categoryId) {
    clauses.push(Prisma.sql`p.category_id = ${query.categoryId}`);
  }

  if (query.brandId) {
    clauses.push(Prisma.sql`p.brand_id = ${query.brandId}`);
  }

  return Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}`;
}

/**
 * Returns the SQL column expression to sort products by.
 *
 * @param sortBy - The sort field selected by the client.
 * @returns A Prisma SQL fragment representing the ORDER BY column.
 */
function getSortFragment(sortBy: ListProductsQuery["sortBy"]): Prisma.Sql {
  if (sortBy === "price") {
    return Prisma.sql`price`;
  }

  if (sortBy === "stock") {
    return Prisma.sql`stockAvailable`;
  }

  return Prisma.sql`p.name`;
}

/**
 * Returns a SQL direction fragment (`ASC` or `DESC`) for the ORDER BY clause.
 *
 * @param sortOrder - The sort direction selected by the client.
 * @returns A Prisma SQL fragment (`ASC` or `DESC`).
 */
function getSortDirectionFragment(sortOrder: ListProductsQuery["sortOrder"]): Prisma.Sql {
  return sortOrder === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
}

/**
 * Returns a paginated, filtered, and sorted list of products for a company.
 *
 * The query joins `categories`, `brands`, product variant pricing
 * (`product_variants`), inventory aggregates, and the primary product image
 * from `product_images` / `digital_assets`.
 *
 * @param companyId - Tenant company identifier.
 * @param query     - Validated list query (search term, filters, pagination, sort).
 * @returns An object containing `items`, `pagination`, and `sort` metadata.
 */
export async function listProducts(companyId: number, query: ListProductsQuery): Promise<unknown> {
  const whereClause = buildProductWhere(companyId, query);
  const sortByClause = getSortFragment(query.sortBy);
  const sortDirectionClause = getSortDirectionFragment(query.sortOrder);
  const offset = (query.page - 1) * query.limit;

  const rows = await prisma.$queryRaw<Array<ProductRow>>(Prisma.sql`
    SELECT
      p.id AS id,
      p.sku AS sku,
      p.name AS name,
      p.description AS description,
      p.category_id AS categoryId,
      c.name AS categoryName,
      p.brand_id AS brandId,
      b.name AS brandName,
      COALESCE(pvAgg.minSalePrice, p.sale_price, 0) AS price,
      COALESCE(invAgg.stockAvailable, 0) AS stockAvailable,
      COALESCE(
        p.thumbnail_url,
        (
          SELECT da.public_url
          FROM product_images pi
          INNER JOIN digital_assets da ON da.id = pi.asset_id
          WHERE pi.company_id = p.company_id
            AND pi.product_id = p.id
            AND pi.is_active = 1
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.created_at DESC
          LIMIT 1
        )
      ) AS imageUrl
    FROM products p
    LEFT JOIN categories c
      ON c.id = p.category_id
      AND c.company_id = p.company_id
      AND c.deleted_at IS NULL
    LEFT JOIN brands b
      ON b.id = p.brand_id
      AND b.company_id = p.company_id
      AND b.deleted_at IS NULL
    LEFT JOIN (
      SELECT pv.product_id AS productId, MIN(pv.sale_price) AS minSalePrice
      FROM product_variants pv
      WHERE pv.company_id = ${companyId}
        AND pv.is_active = 1
        AND pv.deleted_at IS NULL
      GROUP BY pv.product_id
    ) pvAgg ON pvAgg.productId = p.id
    LEFT JOIN (
      SELECT pv.product_id AS productId, COALESCE(SUM(i.quantity_available), 0) AS stockAvailable
      FROM product_variants pv
      LEFT JOIN inventory i
        ON i.product_variant_id = pv.id
        AND i.company_id = pv.company_id
      WHERE pv.company_id = ${companyId}
        AND pv.is_active = 1
        AND pv.deleted_at IS NULL
      GROUP BY pv.product_id
    ) invAgg ON invAgg.productId = p.id
    ${whereClause}
    ORDER BY ${sortByClause} ${sortDirectionClause}, p.id DESC
    LIMIT ${query.limit}
    OFFSET ${offset}
  `);

  const totalRows = await prisma.$queryRaw<Array<{ totalItems: bigint | number }>>(Prisma.sql`
    SELECT COUNT(*) AS totalItems
    FROM products p
    ${whereClause}
  `);

  const totalItemsRaw = totalRows[0]?.totalItems ?? 0;
  const totalItems = typeof totalItemsRaw === "bigint" ? Number(totalItemsRaw) : totalItemsRaw;
  const totalPages = Math.max(1, Math.ceil(totalItems / query.limit));

  return {
    items: rows.map((row) => ({
      id: toNumber(row.id),
      sku: row.sku,
      name: row.name,
      description: row.description,
      categoryId: toNumber(row.categoryId),
      categoryName: row.categoryName,
      brandId: toNumber(row.brandId),
      brandName: row.brandName,
      price: Number(row.price ?? 0),
      stock: Number(row.stockAvailable ?? 0),
      imageUrl: row.imageUrl
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages,
      hasPrevPage: query.page > 1,
      hasNextPage: query.page < totalPages
    },
    sort: {
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    }
  };
}

/**
 * Returns the distinct set of categories and brands that have at least one
 * active product for the given company.
 *
 * Used by the frontend to populate filter dropdowns in the product catalog.
 *
 * @param companyId - Tenant company identifier.
 * @returns An object with `categories` and `brands` arrays (`{ id, name }`).
 */
export async function listProductFilters(companyId: number): Promise<unknown> {
  const [categoryRows, brandRows] = await Promise.all([
    prisma.$queryRaw<Array<FilterRow>>(Prisma.sql`
      SELECT DISTINCT c.id AS id, c.name AS name
      FROM products p
      INNER JOIN categories c
        ON c.id = p.category_id
        AND c.company_id = p.company_id
      WHERE p.company_id = ${companyId}
        AND p.is_active = 1
        AND p.deleted_at IS NULL
        AND c.is_active = 1
        AND c.deleted_at IS NULL
      ORDER BY c.name ASC
    `),
    prisma.$queryRaw<Array<FilterRow>>(Prisma.sql`
      SELECT DISTINCT b.id AS id, b.name AS name
      FROM products p
      INNER JOIN brands b
        ON b.id = p.brand_id
        AND b.company_id = p.company_id
      WHERE p.company_id = ${companyId}
        AND p.is_active = 1
        AND p.deleted_at IS NULL
        AND b.deleted_at IS NULL
      ORDER BY b.name ASC
    `)
  ]);

  return {
    categories: categoryRows.map((row) => ({
      id: toNumber(row.id),
      name: row.name
    })),
    brands: brandRows.map((row) => ({
      id: toNumber(row.id),
      name: row.name
    }))
  };
}
