import { api } from "./api";

export async function listProductImages(productId) {
  const response = await api.get(`/products/${productId}/images`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function uploadProductImage(productId, payload) {
  const formData = new FormData();
  formData.append("image", payload.file);

  if (payload.purpose) {
    formData.append("purpose", payload.purpose);
  }

  if (payload.altText) {
    formData.append("altText", payload.altText);
  }

  if (payload.sortOrder) {
    formData.append("sortOrder", String(payload.sortOrder));
  }

  if (payload.isPrimary) {
    formData.append("isPrimary", "true");
  }

  const response = await api.post(`/products/${productId}/images`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data;
}

export async function updateProductImage(productId, imageId, payload) {
  await api.patch(`/products/${productId}/images/${imageId}`, payload);
}

export async function markPrimaryProductImage(productId, imageId) {
  await api.patch(`/products/${productId}/images/${imageId}/primary`);
}

export async function deleteProductImage(productId, imageId) {
  await api.delete(`/products/${productId}/images/${imageId}`);
}
