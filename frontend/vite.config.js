import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-core": ["vue", "vue-router", "pinia", "axios"],
          "vendor-chart": ["chart.js/auto"],
          "vendor-table": ["jquery", "datatables.net-dt"]
        }
      }
    }
  }
});
