import { defineStore } from "pinia";
import { api } from "../services/api";

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
      const { data } = await api.get("/users/me", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });
      this.profile = data;
    },
    logout() {
      this.accessToken = "";
      this.profile = null;
      localStorage.removeItem("accessToken");
    }
  }
});
