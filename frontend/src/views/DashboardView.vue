<script setup>
import { onMounted, ref } from "vue";
import MainLayout from "../layouts/MainLayout.vue";
import AppChart from "../components/common/AppChart.vue";
import { useAuthStore } from "../store/auth";

const authStore = useAuthStore();
const labels = ref(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);
const values = ref([3400, 4100, 3900, 5100, 6200, 7100]);

onMounted(async () => {
  if (!authStore.profile) {
    await authStore.fetchProfile();
  }
});
</script>

<template>
  <MainLayout>
    <section class="grid gap-spacing-md md:grid-cols-3">
      <article class="glass-card rounded-card p-card shadow-card">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-on-surface-muted">User</h3>
        <p class="mt-2 text-xl font-bold text-on-surface">{{ authStore.profile?.fullName || "-" }}</p>
      </article>

      <article class="glass-card rounded-card p-card shadow-card">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-on-surface-muted">Role</h3>
        <p class="mt-2 text-xl font-bold text-on-surface">{{ authStore.profile?.role || "-" }}</p>
      </article>

      <article class="glass-card rounded-card p-card shadow-card">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-on-surface-muted">Status</h3>
        <p class="mt-2 text-xl font-bold text-secondary">Online</p>
      </article>
    </section>

    <section class="glass-card spacing-section rounded-panel p-card shadow-panel">
      <h2 class="mb-4 font-display text-xl">Revenue Trend</h2>
      <AppChart :labels="labels" :values="values" />
    </section>
  </MainLayout>
</template>
