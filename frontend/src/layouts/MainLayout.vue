<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../store/auth";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const sidebarOpen = ref(false);
const sidebarCollapsed = ref(false);

const navigationCatalog = [
  {
    key: "overview",
    label: "Resumen Ejecutivo",
    icon: "fa-solid fa-chart-pie",
    roles: ["SUPERADMIN", "ADMIN", "MANAGER", "USER"],
    children: [
      {
        label: "Dashboard principal",
        icon: "fa-solid fa-gauge-high",
        to: { name: "dashboard" },
        roles: ["SUPERADMIN", "ADMIN", "MANAGER", "USER"]
      },
      {
        label: "KPIs y alertas",
        icon: "fa-solid fa-wave-square",
        roles: ["SUPERADMIN", "ADMIN", "MANAGER", "USER"]
      },
      {
        label: "Rendimiento comercial",
        icon: "fa-solid fa-coins",
        roles: ["SUPERADMIN", "ADMIN", "MANAGER"]
      }
    ]
  },
  {
    key: "operations",
    label: "Operaciones",
    icon: "fa-solid fa-layer-group",
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    children: [
      { label: "Inventario", icon: "fa-solid fa-boxes-stacked", roles: ["SUPERADMIN", "ADMIN", "MANAGER"] },
      {
        label: "Atencion al cliente",
        icon: "fa-solid fa-headset",
        roles: ["SUPERADMIN", "ADMIN", "MANAGER"]
      },
      { label: "Despachos", icon: "fa-solid fa-truck-fast", roles: ["SUPERADMIN", "ADMIN", "MANAGER"] }
    ]
  },
  {
    key: "governance",
    label: "Gobierno",
    icon: "fa-solid fa-shield-halved",
    roles: ["SUPERADMIN", "ADMIN"],
    children: [
      { label: "Usuarios", icon: "fa-solid fa-users", roles: ["SUPERADMIN", "ADMIN"] },
      { label: "Auditoria", icon: "fa-solid fa-file-shield", roles: ["SUPERADMIN", "ADMIN"] },
      { label: "Configuracion", icon: "fa-solid fa-sliders", roles: ["SUPERADMIN", "ADMIN"] }
    ]
  }
];

function normalizeRole(role) {
  return String(role || "USER").trim().toUpperCase();
}

const navigationSections = computed(() => {
  const userRole = normalizeRole(authStore.profile?.role);

  return navigationCatalog
    .filter((section) => section.roles.includes(userRole))
    .map((section) => ({
      ...section,
      children: section.children.filter((child) => (child.roles || section.roles).includes(userRole))
    }))
    .filter((section) => section.children.length > 0);
});

const expandedMenus = ref(
  navigationCatalog.reduce((accumulator, section, index) => {
    accumulator[section.key] = index === 0;
    return accumulator;
  }, {})
);

const breadcrumbItems = computed(() => {
  const title = route.meta.title || "Dashboard";
  const section = route.meta.section || "Plataforma";

  return [
    { label: section, to: { name: "dashboard" } },
    { label: title }
  ];
});

const isSidebarExpandedView = computed(() => !sidebarCollapsed.value || sidebarOpen.value);

const sidebarClass = computed(() => {
  return [
    sidebarOpen.value ? "translate-x-0" : "-translate-x-full",
    sidebarCollapsed.value ? "xl:w-24" : "xl:w-72"
  ];
});

const layoutClass = computed(() => (sidebarCollapsed.value ? "xl:pl-24" : "xl:pl-72"));

const userInitials = computed(() => {
  const source = authStore.profile?.fullName || "Integra360";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((fragment) => fragment[0]?.toUpperCase() || "")
    .join("");
});

function closeSidebar() {
  sidebarOpen.value = false;
}

function toggleMenu(key) {
  if (sidebarCollapsed.value && !sidebarOpen.value) {
    sidebarCollapsed.value = false;
    return;
  }

  expandedMenus.value[key] = !expandedMenus.value[key];
}

function toggleSidebarCollapsed() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

onMounted(() => {
  if (typeof window === "undefined") {
    return;
  }

  sidebarCollapsed.value = localStorage.getItem("layout.sidebarCollapsed") === "1";
});

watch(sidebarCollapsed, (value) => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("layout.sidebarCollapsed", value ? "1" : "0");
});

function logout() {
  authStore.logout();
  router.push({ name: "login" });
}
</script>

<template>
  <div class="min-h-screen bg-mesh text-on-surface">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-ink-black-900/45 backdrop-blur-sm xl:hidden"
      @click="closeSidebar"
    ></div>

    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-surface-border/80 bg-ink-black-900 text-on-surface-inverse shadow-panel transition-transform duration-300 xl:translate-x-0"
      :class="sidebarClass"
    >
      <div class="border-b border-white/10 px-4 py-5">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3" :class="!isSidebarExpandedView ? 'xl:w-full xl:justify-center' : ''">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-lg font-bold text-white shadow-card">
              I360
            </div>
            <transition name="sidebar-fade-slide" mode="out-in">
              <div v-if="isSidebarExpandedView" key="brand-expanded" class="sidebar-text-block">
                <p class="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Enterprise Suite</p>
                <h1 class="font-display text-xl font-bold">Integra360</h1>
              </div>
            </transition>
          </div>

          <button
            type="button"
            class="hidden h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/12 hover:text-white xl:inline-flex"
            @click="toggleSidebarCollapsed"
          >
            <i :class="sidebarCollapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left'"></i>
          </button>
        </div>
      </div>

      <div class="sidebar-scroll flex-1 overflow-y-auto px-3 py-5">
        <transition name="sidebar-fade-slide" mode="out-in">
          <p
            v-if="isSidebarExpandedView"
            key="nav-heading-expanded"
            class="px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45"
          >
            Navegacion
          </p>
        </transition>

        <nav :class="isSidebarExpandedView ? 'mt-4 space-y-3' : 'mt-1 space-y-2'">
          <div
            v-for="section in navigationSections"
            :key="section.key"
            class="rounded-2xl border border-white/8 bg-white/5 p-2 backdrop-blur"
          >
            <button
              type="button"
              class="flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/8"
              :class="isSidebarExpandedView ? 'justify-between' : 'justify-center'"
              @click="toggleMenu(section.key)"
            >
              <span class="flex items-center" :class="isSidebarExpandedView ? 'gap-3' : 'justify-center'">
                <i :class="section.icon"></i>
                <transition name="sidebar-fade-slide" mode="out-in">
                  <span v-if="isSidebarExpandedView" :key="`${section.key}-label`">{{ section.label }}</span>
                </transition>
              </span>

              <transition name="sidebar-fade-slide" mode="out-in">
                <i
                  v-if="isSidebarExpandedView"
                  :key="`${section.key}-chevron`"
                  class="fa-solid fa-chevron-right text-xs transition-transform"
                  :class="expandedMenus[section.key] ? 'rotate-90' : ''"
                ></i>
              </transition>
            </button>

            <transition name="sidebar-submenu" mode="out-in">
              <div
                v-if="isSidebarExpandedView && expandedMenus[section.key]"
                :key="`${section.key}-submenu`"
                class="mt-2 space-y-1 px-2 pb-2"
              >
                <component
                  :is="child.to ? 'RouterLink' : 'button'"
                  v-for="child in section.children"
                  :key="child.label"
                  :to="child.to"
                  type="button"
                  class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/78 transition hover:bg-white/10 hover:text-white"
                  @click="closeSidebar"
                >
                  <i :class="child.icon"></i>
                  <transition name="sidebar-fade-slide" mode="out-in">
                    <span v-if="isSidebarExpandedView" :key="`${section.key}-${child.label}`">{{ child.label }}</span>
                  </transition>
                </component>
              </div>
            </transition>
          </div>
        </nav>
      </div>

      <div class="border-t border-white/10 px-4 py-4">
        <div class="rounded-2xl bg-gradient-to-r from-white/10 to-white/5 p-4" :class="!isSidebarExpandedView ? 'xl:px-2' : ''">
          <transition name="sidebar-fade-slide" mode="out-in">
            <div v-if="isSidebarExpandedView" key="session-expanded" class="sidebar-text-block">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Sesion activa</p>
              <p class="mt-2 text-sm font-semibold">{{ authStore.profile?.fullName || 'Usuario autenticado' }}</p>
              <p class="text-sm text-white/65">{{ authStore.profile?.role || 'Perfil corporativo' }}</p>
            </div>
            <div v-else key="session-collapsed" class="flex justify-center text-lg text-white/80">
              <i class="fa-solid fa-user-shield"></i>
            </div>
          </transition>
        </div>
      </div>
    </aside>

    <div class="min-h-screen transition-[padding] duration-300" :class="layoutClass">
      <header class="sticky top-0 z-20 border-b border-surface-border/80 bg-white/80 backdrop-blur-xl">
        <div class="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-surface-border bg-white text-primary shadow-soft transition hover:border-primary hover:text-primary xl:hidden"
                @click="sidebarOpen = true"
              >
                <i class="fa-solid fa-bars"></i>
              </button>

              <button
                type="button"
                class="hidden h-11 w-11 items-center justify-center rounded-2xl border border-surface-border bg-white text-primary shadow-soft transition hover:border-primary hover:text-primary xl:inline-flex"
                @click="toggleSidebarCollapsed"
              >
                <i :class="sidebarCollapsed ? 'fa-solid fa-panel-left' : 'fa-solid fa-panel-right'"></i>
              </button>

              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.28em] text-on-surface-subtle">Panel corporativo</p>
                <h2 class="font-display text-2xl font-bold text-on-surface">{{ route.meta.title || 'Dashboard' }}</h2>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="hidden items-center gap-2 rounded-pill border border-secondary/20 bg-secondary/10 px-3 py-2 text-sm font-semibold text-secondary lg:flex">
                <i class="fa-solid fa-signal"></i>
                Operacion estable
              </div>

              <button
                type="button"
                class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-surface-border bg-white text-on-surface shadow-soft transition hover:border-primary hover:text-primary"
              >
                <i class="fa-regular fa-bell"></i>
              </button>

              <div class="hidden items-center gap-3 rounded-2xl border border-surface-border bg-white px-3 py-2 shadow-soft sm:flex">
                <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary font-bold text-white">
                  {{ userInitials }}
                </div>
                <div>
                  <p class="text-sm font-semibold text-on-surface">{{ authStore.profile?.fullName || 'Usuario' }}</p>
                  <p class="text-xs text-on-surface-muted">{{ authStore.profile?.role || 'Perfil interno' }}</p>
                </div>
              </div>

              <button class="btn btn-outline-primary rounded-pill px-4" @click="logout">Salir</button>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-sm text-on-surface-muted">
            <i class="fa-solid fa-location-dot text-primary"></i>
            <template v-for="(item, index) in breadcrumbItems" :key="item.label">
              <RouterLink v-if="item.to" :to="item.to" class="font-semibold text-primary no-underline hover:text-primary-700">
                {{ item.label }}
              </RouterLink>
              <span v-else class="font-semibold text-on-surface">{{ item.label }}</span>
              <i v-if="index < breadcrumbItems.length - 1" class="fa-solid fa-chevron-right text-[10px] text-on-surface-subtle"></i>
            </template>
          </div>
        </div>
      </header>

      <main class="px-4 py-6 sm:px-6 lg:px-8">
        <slot />
      </main>

      <footer class="border-t border-surface-border/80 bg-white/70 px-4 py-4 text-sm text-on-surface-muted backdrop-blur sm:px-6 lg:px-8">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-2 font-semibold text-on-surface">
            <i class="fa-regular fa-copyright text-primary"></i>
            Integra360. Todos los derechos reservados.
          </div>
          <div class="flex flex-wrap items-center gap-4">
            <span>Version 0.1.0</span>
            <span>Build corporativo abril 2026</span>
            <span>Mesa de ayuda: soporte@integra360.local</span>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>
