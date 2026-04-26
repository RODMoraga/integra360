import { defineStore } from "pinia";
import { api } from "../services/api";

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = atob(base64 + padding);

    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp || typeof payload.exp !== "number") {
    return false;
  }

  // Small skew tolerance to avoid edge-case requests right at expiration.
  return Date.now() >= payload.exp * 1000 - 5000;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    accessToken: localStorage.getItem("accessToken") || "",
    profile: null,
    loading: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken)
  },
  actions: {
    async login(payload) {
      this.loading = true;
      try {
        const { data } = await api.post("/auth/login", payload);
        this.accessToken = data.accessToken;
        localStorage.setItem("accessToken", data.accessToken);
      } finally {
        this.loading = false;
      }
    },
    async fetchProfile() {
      if (!this.accessToken) return;

      if (isTokenExpired(this.accessToken)) {
        this.logout();
        return null;
      }

      try {
        const { data } = await api.get("/users/me", {
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          }
        });

        this.profile = data;
        return data;
      } catch (error) {
        if (error?.response?.status === 401) {
          this.logout();
        }

        this.profile = null;
        return null;
      }
    },
    logout() {
      this.accessToken = "";
      this.profile = null;
      localStorage.removeItem("accessToken");
    }
  }
});
