<script setup>
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store/auth";
import { useToast } from "../composables/useToast";

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

const form = reactive({
  email: "admin@integra360.local",
  password: "Admin123456!"
});

async function submit() {
  try {
    await authStore.login(form);
    await authStore.fetchProfile();
    toast.success("Welcome back");
    router.push({ name: "dashboard" });
  } catch {
    toast.error("Invalid credentials");
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-mesh px-container">
    <div class="glass-card surface-panel w-full max-w-md rounded-panel p-card shadow-elevated">
      <h2 class="font-display text-2xl text-on-surface">Sign in</h2>
      <p class="mb-spacing-lg mt-spacing-sm text-sm text-on-surface-muted">Access your Integra360 workspace</p>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1 block text-sm font-semibold">Email</label>
          <input v-model="form.email" type="email" class="form-control" required />
        </div>
        <div>
          <label class="mb-1 block text-sm font-semibold">Password</label>
          <input v-model="form.password" type="password" class="form-control" required />
        </div>

        <button type="submit" class="btn btn-primary w-100" :disabled="authStore.loading">
          {{ authStore.loading ? "Signing in..." : "Sign in" }}
        </button>
      </form>
    </div>
  </div>
</template>
