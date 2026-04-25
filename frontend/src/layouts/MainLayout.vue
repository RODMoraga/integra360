<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "../store/auth";

const authStore = useAuthStore();
const router = useRouter();

function logout() {
  authStore.logout();
  router.push({ name: "login" });
}
</script>

<template>
  <div class="min-h-screen bg-mesh text-on-surface">
    <header class="border-b border-surface-border bg-surface-elevated/80 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-container py-spacing-sm">
        <h1 class="font-display text-xl text-on-surface">Integra360 Platform</h1>
        <button class="btn btn-outline-primary" @click="logout">Logout</button>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-container py-section">
      <slot />
    </main>
  </div>
</template>
