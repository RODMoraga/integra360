import { StatusCodes } from "http-status-codes";
import { prisma } from "../../../database/prisma/client.js";
import { AppError } from "../../../common/errors/AppError.js";

type ImagePurpose = "PRIMARY" | "GALLERY" | "THUMBNAIL" | "DETAIL" | "PACKAGING";

type CreateImageInput = {
  companyId: number;
  productId: number;
  purpose: ImagePurpose;
  altText?: string;
  sortOrder?: number;
  isPrimary: boolean;
  originalFilename: string;
  mimeType: string;
  extension?: string;
  sizeBytes: number;
  widthPx?: number;
  heightPx?: number;
  storageDisk: "local";
  storageKey: string;
  publicUrl: string;
};

type UpdateImageInput = {
  companyId: number;
  productId: number;
  imageId: number;
  purpose?: ImagePurpose;
  altText?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

type ProductImageListRow = {
  imageId: bigint | number;
  productId: bigint | number;
  assetId: bigint | number;
  purpose: ImagePurpose;
  altText: string | null;
  sortOrder: number;
  isPrimary: number | boolean;
  isActive: number | boolean;
  createdAt: Date;
  storageDisk: string;
  storageKey: string;
  publicUrl: string | null;
  mimeType: string;
  extension: string | null;
  sizeBytes: bigint | number;
  widthPx: number | null;
  heightPx: number | null;
};

/**
 * Converts a `bigint` or `number` to a plain `number`.
 *
 * @param value - The value to convert.
 */
function toNumber(value: bigint | number): number {
  return typeof value === "bigint" ? Number(value) : value;
}

/**
 * Verifies that a product with the given ID exists for the company.
 * Throws **404 Not Found** if the product is absent or soft-deleted.
 *
 * @param companyId - Tenant company identifier.
 * @param productId - Product identifier.
 * @throws {AppError} 404 if the product does not exist.
 */
async function assertProductExists(companyId: number, productId: number): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ id: bigint | number }>>`
    SELECT id
    FROM products
    WHERE id = ${productId}
      AND company_id = ${companyId}
      AND deleted_at IS NULL
    LIMIT 1
  `;

  if (rows.length === 0) {
    throw new AppError("Product not found", StatusCodes.NOT_FOUND);
  }
}

/**
 * Ensures the requested `sortOrder` value is not already assigned to another
 * image for the same product within the company.
 *
 * @param companyId      - Tenant company identifier.
 * @param productId      - Product identifier.
 * @param sortOrder      - The sort-order value to check.
 * @param excludeImageId - Optional image ID to exclude from the conflict check
 *                         (used when updating an existing image).
 * @throws {AppError} 409 Conflict if `sortOrder` is already in use.
 */
async function assertSortOrderAvailable(
  companyId: number,
  productId: number,
  sortOrder: number,
  excludeImageId?: number
): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ id: bigint | number }>>`
    SELECT id
    FROM product_images
    WHERE company_id = ${companyId}
      AND product_id = ${productId}
      AND sort_order = ${sortOrder}
      AND (${excludeImageId ?? 0} = 0 OR id <> ${excludeImageId ?? 0})
    LIMIT 1
  `;

  if (rows.length > 0) {
    throw new AppError("sortOrder already in use for this product", StatusCodes.CONFLICT);
  }
}

/**
 * Calculates the next available `sort_order` value for a product's images
 * by incrementing the current maximum by 1.
 *
 * @param companyId - Tenant company identifier.
 * @param productId - Product identifier.
 * @returns The next `sortOrder` integer to use.
 */
async function getNextSortOrder(companyId: number, productId: number): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ maxSortOrder: number | null }>>`
    SELECT COALESCE(MAX(sort_order), 0) AS maxSortOrder
    FROM product_images
    WHERE company_id = ${companyId}
      AND product_id = ${productId}
  `;

  return Number(rows[0]?.maxSortOrder ?? 0) + 1;
}

/**
 * Retrieves all active images for a product, ordered by primary flag,
 * sort order, and creation date.
 *
 * @param companyId - Tenant company identifier.
 * @param productId - Product identifier.
 * @returns Array of image objects including nested `asset` metadata.
 * @throws {AppError} 404 if the product does not exist.
 */
export async function listProductImages(companyId: number, productId: number): Promise<unknown[]> {
  await assertProductExists(companyId, productId);

  const rows = await prisma.$queryRaw<Array<ProductImageListRow>>`
    SELECT
      pi.id AS imageId,
      pi.product_id AS productId,
      pi.asset_id AS assetId,
      pi.purpose AS purpose,
      pi.alt_text AS altText,
      pi.sort_order AS sortOrder,
      pi.is_primary AS isPrimary,
      pi.is_active AS isActive,
      pi.created_at AS createdAt,
      da.storage_disk AS storageDisk,
      da.storage_key AS storageKey,
      da.public_url AS publicUrl,
      da.mime_type AS mimeType,
      da.extension AS extension,
      da.size_bytes AS sizeBytes,
      da.width_px AS widthPx,
      da.height_px AS heightPx
    FROM product_images pi
    INNER JOIN digital_assets da ON da.id = pi.asset_id
    WHERE pi.company_id = ${companyId}
      AND pi.product_id = ${productId}
      AND pi.is_active = 1
    ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.created_at DESC
  `;

  return rows.map((row) => ({
    id: toNumber(row.imageId),
    productId: toNumber(row.productId),
    assetId: toNumber(row.assetId),
    purpose: row.purpose,
    altText: row.altText,
    sortOrder: row.sortOrder,
    isPrimary: Boolean(row.isPrimary),
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
    asset: {
      storageDisk: row.storageDisk,
      storageKey: row.storageKey,
      publicUrl: row.publicUrl,
      mimeType: row.mimeType,
      extension: row.extension,
      sizeBytes: toNumber(row.sizeBytes),
      widthPx: row.widthPx,
      heightPx: row.heightPx
    }
  }));
}

/**
 * Persists a newly uploaded product image by creating a `digital_assets`
 * record and a linked `product_images` row inside a transaction.
 * When `isPrimary` is `true`, all existing images for the product are
 * demoted before the new record is inserted.
 *
 * @param input - Upload metadata including file info and image properties.
 * @returns The newly created image record with its asset details.
 * @throws {AppError} 404 if the product does not exist.
 * @throws {AppError} 409 if the requested `sortOrder` is already in use.
 */
export async function createProductImage(input: CreateImageInput): Promise<unknown> {
  await assertProductExists(input.companyId, input.productId);

  const desiredSortOrder = input.sortOrder ?? (await getNextSortOrder(input.companyId, input.productId));
  await assertSortOrderAvailable(input.companyId, input.productId, desiredSortOrder);

  const normalizedPurpose: ImagePurpose = input.isPrimary ? "PRIMARY" : input.purpose;

  const created = await prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.$executeRaw`
        UPDATE product_images
        SET is_primary = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE company_id = ${input.companyId}
          AND product_id = ${input.productId}
      `;
    }

    await tx.$executeRaw`
      INSERT INTO digital_assets (
        company_id,
        storage_disk,
        storage_key,
        original_filename,
        public_url,
        mime_type,
        extension,
        size_bytes,
        width_px,
        height_px
      ) VALUES (
        ${input.companyId},
        ${input.storageDisk},
        ${input.storageKey},
        ${input.originalFilename},
        ${input.publicUrl},
        ${input.mimeType},
        ${input.extension ?? null},
        ${input.sizeBytes},
        ${input.widthPx ?? null},
        ${input.heightPx ?? null}
      )
    `;

    const assetIdRows = await tx.$queryRaw<Array<{ id: bigint | number }>>`SELECT LAST_INSERT_ID() AS id`;
    const assetId = toNumber(assetIdRows[0].id);

    await tx.$executeRaw`
      INSERT INTO product_images (
        company_id,
        product_id,
        asset_id,
        purpose,
        alt_text,
        sort_order,
        is_primary,
        is_active
      ) VALUES (
        ${input.companyId},
        ${input.productId},
        ${assetId},
        ${normalizedPurpose},
        ${input.altText ?? null},
        ${desiredSortOrder},
        ${input.isPrimary ? 1 : 0},
        1
      )
    `;

    const imageIdRows = await tx.$queryRaw<Array<{ id: bigint | number }>>`SELECT LAST_INSERT_ID() AS id`;

    return {
      id: toNumber(imageIdRows[0].id),
      productId: input.productId,
      assetId,
      purpose: normalizedPurpose,
      altText: input.altText ?? null,
      sortOrder: desiredSortOrder,
      isPrimary: input.isPrimary,
      asset: {
        storageDisk: input.storageDisk,
        storageKey: input.storageKey,
        publicUrl: input.publicUrl,
        mimeType: input.mimeType,
        extension: input.extension ?? null,
        sizeBytes: input.sizeBytes,
        widthPx: input.widthPx ?? null,
        heightPx: input.heightPx ?? null
      }
    };
  });

  return created;
}

/**
 * Updates mutable metadata fields (`purpose`, `altText`, `sortOrder`,
 * `isActive`) of an existing product image.
 *
 * @param input - Update payload; at least one field must differ from the
 *                current value (enforced at the schema level).
 * @throws {AppError} 404 if the product or image does not exist.
 * @throws {AppError} 409 if the new `sortOrder` conflicts with another image.
 */
export async function updateProductImage(input: UpdateImageInput): Promise<void> {
  await assertProductExists(input.companyId, input.productId);

  const currentRows = await prisma.$queryRaw<Array<{ id: bigint | number }>>`
    SELECT id
    FROM product_images
    WHERE id = ${input.imageId}
      AND company_id = ${input.companyId}
      AND product_id = ${input.productId}
    LIMIT 1
  `;

  if (currentRows.length === 0) {
    throw new AppError("Product image not found", StatusCodes.NOT_FOUND);
  }

  if (input.sortOrder !== undefined) {
    await assertSortOrderAvailable(input.companyId, input.productId, input.sortOrder, input.imageId);
  }

  await prisma.$executeRaw`
    UPDATE product_images
    SET
      purpose = COALESCE(${input.purpose ?? null}, purpose),
      alt_text = CASE
        WHEN ${input.altText !== undefined} THEN ${input.altText ?? null}
        ELSE alt_text
      END,
      sort_order = COALESCE(${input.sortOrder ?? null}, sort_order),
      is_active = CASE
        WHEN ${input.isActive !== undefined} THEN ${input.isActive ? 1 : 0}
        ELSE is_active
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${input.imageId}
      AND company_id = ${input.companyId}
      AND product_id = ${input.productId}
  `;
}

/**
 * Promotes the specified image to primary for a product within a transaction:
 * 1. Demotes all other images by setting `is_primary = 0`.
 * 2. Sets `is_primary = 1` and `purpose = 'PRIMARY'` on the target image.
 *
 * @param companyId - Tenant company identifier.
 * @param productId - Product identifier.
 * @param imageId   - ID of the image to promote.
 * @throws {AppError} 404 if the product or (active) image does not exist.
 */
export async function setPrimaryProductImage(companyId: number, productId: number, imageId: number): Promise<void> {
  await assertProductExists(companyId, productId);

  await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: bigint | number }>>`
      SELECT id
      FROM product_images
      WHERE id = ${imageId}
        AND company_id = ${companyId}
        AND product_id = ${productId}
        AND is_active = 1
      LIMIT 1
    `;

    if (rows.length === 0) {
      throw new AppError("Product image not found", StatusCodes.NOT_FOUND);
    }

    await tx.$executeRaw`
      UPDATE product_images
      SET is_primary = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE company_id = ${companyId}
        AND product_id = ${productId}
    `;

    await tx.$executeRaw`
      UPDATE product_images
      SET is_primary = 1,
          purpose = 'PRIMARY',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${imageId}
        AND company_id = ${companyId}
        AND product_id = ${productId}
    `;
  });
}

/**
 * Deletes a product image and its `digital_assets` record (if no other
 * images reference it) within a transaction.
 *
 * Returns metadata that tells the controller whether to delete the
 * corresponding file from local disk storage.
 *
 * @param companyId - Tenant company identifier.
 * @param productId - Product identifier.
 * @param imageId   - ID of the image to delete.
 * @returns `{ deleteLocalFile, storageKey }` — `deleteLocalFile` is `true`
 *   when the asset has no remaining references and is stored on local disk.
 * @throws {AppError} 404 if the product or image does not exist.
 */
export async function deleteProductImage(
  companyId: number,
  productId: number,
  imageId: number
): Promise<{ deleteLocalFile: boolean; storageKey: string | null }> {
  await assertProductExists(companyId, productId);

  const imageRows = await prisma.$queryRaw<
    Array<{ assetId: bigint | number; storageDisk: string; storageKey: string; publicUrl: string | null }>
  >`
    SELECT
      pi.asset_id AS assetId,
      da.storage_disk AS storageDisk,
      da.storage_key AS storageKey,
      da.public_url AS publicUrl
    FROM product_images pi
    INNER JOIN digital_assets da ON da.id = pi.asset_id
    WHERE pi.id = ${imageId}
      AND pi.company_id = ${companyId}
      AND pi.product_id = ${productId}
    LIMIT 1
  `;

  if (imageRows.length === 0) {
    throw new AppError("Product image not found", StatusCodes.NOT_FOUND);
  }

  const target = imageRows[0];
  const assetId = toNumber(target.assetId);

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      DELETE FROM product_images
      WHERE id = ${imageId}
        AND company_id = ${companyId}
        AND product_id = ${productId}
    `;

    const refs = await tx.$queryRaw<Array<{ refs: bigint | number }>>`
      SELECT COUNT(*) AS refs
      FROM product_images
      WHERE asset_id = ${assetId}
    `;

    const references = toNumber(refs[0].refs);
    if (references === 0) {
      await tx.$executeRaw`
        DELETE FROM digital_assets
        WHERE id = ${assetId}
      `;

      return {
        deleteLocalFile: target.storageDisk === "local",
        storageKey: target.storageKey
      };
    }

    return {
      deleteLocalFile: false,
      storageKey: null
    };
  });
}
