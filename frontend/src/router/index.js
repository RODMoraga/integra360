import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/auth";

const HomeView = () => import("../views/HomeView.vue");
const DashboardView = () => import("../views/DashboardView.vue");
const LoginView = () => import("../views/LoginView.vue");

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
    meta: { title: "Inicio" }
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { title: "Acceso" }
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: DashboardView,
    meta: { requiresAuth: true, title: "Dashboard Ejecutivo", section: "Control Operativo" }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: "login" };
  }

  if (to.name === "login" && authStore.isAuthenticated) {
    return { name: "dashboard" };
  }

  return true;
});

export default router;
