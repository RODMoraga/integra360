import { api, DEFAULT_COMPANY_ID, resolveAssetUrl } from "./api";

export async function getProductFilters({ companyId = DEFAULT_COMPANY_ID } = {}) {
  const response = await api.get("/products/filters", {
    params: { companyId }
  });

  const categories = Array.isArray(response.data?.categories) ? response.data.categories : [];
  const brands = Array.isArray(response.data?.brands) ? response.data.brands : [];

  return {
    categories,
    brands
  };
}

export async function getProducts({
  companyId = DEFAULT_COMPANY_ID,
  query = "",
  categoryId = "",
  brandId = "",
  page = 1,
  limit = 9,
  sortBy = "name",
  sortOrder = "asc"
} = {}) {
  const params = {
    companyId,
    q: query,
    page,
    limit,
    sortBy,
    sortOrder
  };

  if (categoryId) {
    params.categoryId = Number(categoryId);
  }

  if (brandId) {
    params.brandId = Number(brandId);
  }

  const response = await api.get("/products", { params });

  const items = Array.isArray(response.data?.items)
    ? response.data.items.map((item) => ({
        ...item,
        imageUrl: resolveAssetUrl(item.imageUrl)
      }))
    : [];
  const pagination = response.data?.pagination || null;

  return {
    items,
    pagination: pagination || {
      page,
      limit,
      totalItems: items.length,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false
    }
  };
}
