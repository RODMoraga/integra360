<script setup>
import { computed, onMounted, ref } from "vue";
import MainLayout from "../layouts/MainLayout.vue";
import AppChart from "../components/common/AppChart.vue";
import AppDataTable from "../components/common/AppDataTable.vue";
import { useAuthStore } from "../store/auth";
import { DEFAULT_COMPANY_ID } from "../services/api";
import { getProducts } from "../services/products";

const authStore = useAuthStore();

const loading = ref(false);
const errorMessage = ref("");
const products = ref([]);
const filters = ref({ categories: [], brands: [] });

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const compactNumberFormatter = new Intl.NumberFormat("es-ES", {
  notation: "compact",
  maximumFractionDigits: 1
});

const numberFormatter = new Intl.NumberFormat("es-ES");

const currentDateLabel = new Intl.DateTimeFormat("es-EC", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric"
}).format(new Date());

const normalizedProducts = computed(() => {
  return products.value.map((item) => ({
    ...item,
    price: Number(item.price || 0),
    stock: Number(item.stock || 0)
  }));
});

const totalInventoryValue = computed(() => {
  return normalizedProducts.value.reduce((accumulator, item) => accumulator + item.price * item.stock, 0);
});

const inStockCount = computed(() => {
  return normalizedProducts.value.filter((item) => item.stock > 0).length;
});

const availabilityPercent = computed(() => {
  const total = normalizedProducts.value.length;
  if (!total) return 0;
  return Math.round((inStockCount.value / total) * 1000) / 10;
});

const averageTicket = computed(() => {
  const total = normalizedProducts.value.length;
  if (!total) return 0;
  const sum = normalizedProducts.value.reduce((accumulator, item) => accumulator + item.price, 0);
  return sum / total;
});

const summaryCards = computed(() => {
  return [
    {
      title: "Inventario valorizado",
      value: currencyFormatter.format(totalInventoryValue.value),
      change: `${numberFormatter.format(normalizedProducts.value.length)} productos activos`,
      icon: "fa-solid fa-sack-dollar",
      accent: "from-primary to-primary-700"
    },
    {
      title: "Productos en stock",
      value: numberFormatter.format(inStockCount.value),
      change: `${numberFormatter.format(normalizedProducts.value.length - inStockCount.value)} sin stock`,
      icon: "fa-solid fa-cart-flatbed",
      accent: "from-secondary to-secondary-700"
    },
    {
      title: "Disponibilidad",
      value: `${availabilityPercent.value.toFixed(1)}%`,
      change: "Cobertura actual del catalogo",
      icon: "fa-solid fa-box-open",
      accent: "from-warning to-orange-600"
    },
    {
      title: "Ticket promedio",
      value: currencyFormatter.format(averageTicket.value),
      change: `${numberFormatter.format(filters.value.categories.length)} categorias con datos`,
      icon: "fa-solid fa-face-smile-beam",
      accent: "from-ink-black-600 to-ink-black-900"
    }
  ];
});

const revenueTopProducts = computed(() => {
  return [...normalizedProducts.value]
    .map((item) => ({
      ...item,
      inventoryValue: item.price * item.stock
    }))
    .sort((left, right) => right.inventoryValue - left.inventoryValue)
    .slice(0, 7);
});

const revenueLabels = computed(() => {
  return revenueTopProducts.value.map((item) => item.name || item.sku || "Producto");
});

const revenueDatasets = computed(() => {
  const inventoryValues = revenueTopProducts.value.map((item) => Number(item.inventoryValue.toFixed(2)));
  const average = inventoryValues.length
    ? inventoryValues.reduce((accumulator, value) => accumulator + value, 0) / inventoryValues.length
    : 0;

  return [
    {
      label: "Valor inventario",
      data: inventoryValues,
      borderColor: "#1736e8",
      backgroundColor: "rgba(23, 54, 232, 0.14)",
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: "#ffffff",
      pointBorderWidth: 2
    },
    {
      label: "Promedio",
      data: inventoryValues.map(() => Number(average.toFixed(2))),
      borderColor: "#e61961",
      borderDash: [6, 6],
      backgroundColor: "rgba(230, 25, 97, 0)",
      fill: false,
      tension: 0.2,
      pointRadius: 0
    }
  ];
});

const categoryDistribution = computed(() => {
  const counters = new Map();

  normalizedProducts.value.forEach((item) => {
    const key = item.categoryName || "Sin categoria";
    counters.set(key, (counters.get(key) || 0) + 1);
  });

  return [...counters.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((left, right) => right.total - left.total)
    .slice(0, 4);
});

const channelLabels = computed(() => {
  return categoryDistribution.value.map((item) => item.name);
});

const channelDatasets = computed(() => {
  return [
    {
      label: "Productos",
      data: categoryDistribution.value.map((item) => item.total),
      backgroundColor: ["#1736e8", "#455eed", "#e61961", "#f99006"],
      borderRadius: 14,
      borderSkipped: false
    }
  ];
});

const topProductsRows = computed(() => {
  return [...normalizedProducts.value]
    .map((item) => ({
      sku: item.sku,
      product: item.name,
      category: item.categoryName || "Sin categoria",
      price: item.price,
      stock: item.stock,
      inventoryValue: item.price * item.stock
    }))
    .sort((left, right) => right.inventoryValue - left.inventoryValue)
    .slice(0, 12);
});

const categoryQueueRows = computed(() => {
  const grouped = new Map();

  normalizedProducts.value.forEach((item) => {
    const key = item.categoryName || "Sin categoria";
    const current = grouped.get(key) || { category: key, products: 0, totalStock: 0, lowStock: 0 };

    current.products += 1;
    current.totalStock += item.stock;
    if (item.stock <= 10) {
      current.lowStock += 1;
    }

    grouped.set(key, current);
  });

  return [...grouped.values()]
    .map((item) => ({
      ...item,
      averageStock: item.products ? item.totalStock / item.products : 0,
      sla: item.lowStock > 4 ? "Critico" : item.lowStock > 1 ? "Atencion" : "Estable"
    }))
    .sort((left, right) => right.products - left.products)
    .slice(0, 10);
});

const brandTrendRows = computed(() => {
  const grouped = new Map();

  normalizedProducts.value.forEach((item) => {
    const key = item.brandName || "Sin marca";
    const current = grouped.get(key) || { brand: key, products: 0, totalStock: 0, totalPrice: 0 };

    current.products += 1;
    current.totalStock += item.stock;
    current.totalPrice += item.price;

    grouped.set(key, current);
  });

  return [...grouped.values()]
    .map((item) => {
      const avgStock = item.products ? item.totalStock / item.products : 0;
      const avgPrice = item.products ? item.totalPrice / item.products : 0;
      const trend = avgStock >= 25 ? "up" : avgStock <= 10 ? "down" : "flat";
      const variation = avgStock >= 25 ? `+${Math.round(avgStock)}%` : avgStock <= 10 ? `-${Math.round(12 - avgStock)}%` : `${Math.round(avgStock)}%`;
      const forecast = trend === "up" ? "Favorable" : trend === "down" ? "Revisar" : "Estable";

      return {
        indicator: item.brand,
        variation,
        trend,
        forecast,
        reference: currencyFormatter.format(avgPrice)
      };
    })
    .sort((left, right) => left.indicator.localeCompare(right.indicator))
    .slice(0, 12);
});

const topProductsColumns = [
  { title: "SKU", data: "sku" },
  { title: "Producto", data: "product" },
  { title: "Categoria", data: "category" },
  {
    title: "Precio",
    data: "price",
    render: (value) => currencyFormatter.format(value)
  },
  {
    title: "Stock",
    data: "stock",
    render: (value) => `<span class="font-semibold text-primary">${numberFormatter.format(value)}</span>`
  },
  {
    title: "Valor inventario",
    data: "inventoryValue",
    render: (value) => currencyFormatter.format(value)
  }
];

const categoryQueueColumns = [
  { title: "Categoria", data: "category" },
  {
    title: "Productos",
    data: "products",
    render: (value) => numberFormatter.format(value)
  },
  {
    title: "Stock promedio",
    data: "averageStock",
    render: (value) => numberFormatter.format(Math.round(value))
  },
  {
    title: "Bajo stock",
    data: "lowStock",
    render: (value) => `<span class="table-pill ${value > 2 ? "pill-warning" : "pill-positive"}">${numberFormatter.format(value)}</span>`
  },
  {
    title: "Estado",
    data: "sla",
    render: (value) => {
      const variant = value === "Critico" ? "pill-danger" : value === "Atencion" ? "pill-warning" : "pill-positive";
      return `<span class="table-pill ${variant}">${value}</span>`;
    }
  }
];

const trendColumns = [
  { title: "Indicador", data: "indicator" },
  {
    title: "Variacion",
    data: "variation",
    render: (value, _type, row) => {
      const icon =
        row.trend === "up"
          ? "fa-arrow-trend-up text-emerald-600"
          : row.trend === "down"
            ? "fa-arrow-trend-down text-danger"
            : "fa-arrows-left-right-to-line text-warning";

      return `<span class="trend-badge"><i class="fa-solid ${icon}"></i>${value}</span>`;
    }
  },
  {
    title: "Pronostico",
    data: "forecast",
    render: (value) => {
      const variant = value === "Revisar" ? "pill-danger" : value === "Estable" ? "pill-warning" : "pill-positive";
      return `<span class="table-pill ${variant}">${value}</span>`;
    }
  },
  { title: "Referencia precio", data: "reference" }
];

const greetingName = computed(() => authStore.profile?.fullName || "equipo Integra360");
const revenueHeadline = computed(() => compactNumberFormatter.format(totalInventoryValue.value || 0));

async function loadDashboardData() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const productsResponse = await getProducts({
      companyId: DEFAULT_COMPANY_ID,
      limit: 60,
      page: 1,
      sortBy: "stock",
      sortOrder: "desc"
    });

    const items = Array.isArray(productsResponse.items) ? productsResponse.items : [];
    const categoryNames = [...new Set(items.map((item) => item.categoryName).filter(Boolean))];
    const brandNames = [...new Set(items.map((item) => item.brandName).filter(Boolean))];

    products.value = items;
    filters.value = {
      categories: categoryNames,
      brands: brandNames
    };
  } catch (error) {
    products.value = [];
    filters.value = { categories: [], brands: [] };
    errorMessage.value = error?.response?.data?.message || "No fue posible cargar los indicadores reales del dashboard.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if (!authStore.profile && authStore.accessToken) {
    await authStore.fetchProfile();
  }

  await loadDashboardData();
});
</script>

<template>
  <MainLayout>
    <section class="dashboard-hero glass-card rounded-panel p-card shadow-panel">
      <div class="grid gap-6 xl:grid-cols-[1.4fr_0.9fr] xl:items-center">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Vision operativa 360</p>
          <h1 class="mt-3 max-w-3xl font-display text-3xl font-bold text-on-surface sm:text-4xl">
            Bienvenido, {{ greetingName }}. Este es el pulso comercial y operativo de hoy.
          </h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-on-surface-muted">
            Indicadores conectados a datos reales del backend de catalogo. Monitorea inventario, disponibilidad y composicion de productos en una sola vista.
          </p>

          <div class="mt-6 flex flex-wrap gap-3">
            <span class="info-chip"><i class="fa-regular fa-calendar"></i>{{ currentDateLabel }}</span>
            <span class="info-chip"><i class="fa-solid fa-database"></i>Fuente: API productos</span>
            <span class="info-chip"><i class="fa-solid fa-user-shield"></i>Rol: {{ authStore.profile?.role || 'Interno' }}</span>
          </div>
        </div>

        <div class="hero-highlight-panel">
          <p class="text-xs font-semibold uppercase tracking-[0.26em] text-white/65">Inventario valorizado</p>
          <div class="mt-4 flex items-end gap-4">
            <span class="text-5xl font-bold text-white">{{ revenueHeadline }}</span>
            <span class="rounded-pill bg-white/12 px-3 py-2 text-sm font-semibold text-white">real-time</span>
          </div>
          <p class="mt-3 text-sm leading-6 text-white/72">
            Valores calculados con precio y stock por producto activo en la compania actual.
          </p>
          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <div class="hero-mini-stat">
              <span class="hero-mini-stat__label">Categorias activas</span>
              <strong>{{ numberFormatter.format(filters.categories.length) }}</strong>
            </div>
            <div class="hero-mini-stat">
              <span class="hero-mini-stat__label">Marcas activas</span>
              <strong>{{ numberFormatter.format(filters.brands.length) }}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="errorMessage" class="mt-section rounded-panel border border-danger/20 bg-danger/10 p-card text-danger">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span class="font-semibold">{{ errorMessage }}</span>
      </div>
    </section>

    <section class="mt-section grid gap-spacing-md sm:grid-cols-2 2xl:grid-cols-4">
      <article
        v-for="card in summaryCards"
        :key="card.title"
        class="metric-card rounded-panel border border-surface-border/80 bg-white/95 p-card shadow-card"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-on-surface-muted">{{ card.title }}</p>
            <p class="mt-4 text-3xl font-bold text-on-surface">{{ card.value }}</p>
          </div>
          <div class="metric-icon bg-gradient-to-br" :class="card.accent">
            <i :class="card.icon"></i>
          </div>
        </div>
        <p class="mt-4 text-sm text-on-surface-muted">{{ card.change }}</p>
      </article>
    </section>

    <section class="mt-section grid gap-spacing-md xl:grid-cols-2">
      <article class="glass-card rounded-panel p-card shadow-panel">
        <div class="section-heading">
          <div>
            <p class="section-kicker">KPI financiero</p>
            <h2 class="font-display text-2xl font-bold text-on-surface">Top productos por valor de inventario</h2>
          </div>
          <span class="section-badge">Datos reales</span>
        </div>
        <AppChart :labels="revenueLabels" :datasets="revenueDatasets" />
      </article>

      <article class="glass-card rounded-panel p-card shadow-panel">
        <div class="section-heading">
          <div>
            <p class="section-kicker">Distribucion</p>
            <h2 class="font-display text-2xl font-bold text-on-surface">Categorias con mayor participacion</h2>
          </div>
          <span class="section-badge section-badge--secondary">Catalogo</span>
        </div>
        <AppChart
          type="bar"
          :labels="channelLabels"
          :datasets="channelDatasets"
          :options="{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }"
        />
      </article>
    </section>

    <section class="mt-section grid gap-spacing-md 2xl:grid-cols-2">
      <article class="glass-card rounded-panel p-card shadow-panel">
        <div class="section-heading">
          <div>
            <p class="section-kicker">DataTable</p>
            <h2 class="font-display text-2xl font-bold text-on-surface">Productos lideres por valor inventario</h2>
          </div>
          <span class="section-badge">Top dinamico</span>
        </div>
        <AppDataTable :columns="topProductsColumns" :rows="topProductsRows" :options="{ paging: true, searching: true }" />
      </article>

      <article class="glass-card rounded-panel p-card shadow-panel">
        <div class="section-heading">
          <div>
            <p class="section-kicker">DataTable</p>
            <h2 class="font-display text-2xl font-bold text-on-surface">Cobertura operativa por categoria</h2>
          </div>
          <span class="section-badge section-badge--warning">SLA de stock</span>
        </div>
        <AppDataTable :columns="categoryQueueColumns" :rows="categoryQueueRows" :options="{ paging: true, searching: true }" />
      </article>
    </section>

    <section class="mt-section glass-card rounded-panel p-card shadow-panel">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Tendencias</p>
          <h2 class="font-display text-2xl font-bold text-on-surface">Indicadores por marca con proyeccion</h2>
        </div>
        <span class="section-badge section-badge--dark">Decision support</span>
      </div>
      <AppDataTable
        :columns="trendColumns"
        :rows="brandTrendRows"
        :options="{ paging: true, searching: true, pageLength: 6 }"
        :page-length="6"
      />
    </section>

    <p v-if="loading" class="mt-4 text-sm font-semibold text-on-surface-muted">Actualizando dashboard...</p>
  </MainLayout>
</template>
