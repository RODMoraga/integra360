import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
export const DEFAULT_COMPANY_ID = Number(import.meta.env.VITE_COMPANY_ID || 2);

// Derive the backend origin (e.g. "http://localhost:3000") so that
// relative asset paths like "/uploads/..." can be resolved correctly.
const BACKEND_ORIGIN = new URL(API_BASE_URL).origin;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  config.headers = config.headers || {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["x-company-id"] = String(DEFAULT_COMPANY_ID);

  return config;
});

/**
 * Resolves a backend asset URL to an absolute URL.
 * Relative paths (e.g. "/uploads/product-images/2/file.jpg") are prefixed
 * with the backend origin so the browser fetches from the correct server.
 * Absolute URLs are returned unchanged.
 *
 * @param {string | null | undefined} url - The raw URL from the API response.
 * @returns {string | null} An absolute URL, or null if the input is falsy.
 */
export function resolveAssetUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BACKEND_ORIGIN}${url}`;
}
