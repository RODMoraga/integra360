<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import AppAdvancedSelect from "../components/common/AppAdvancedSelect.vue";
import { getProductFilters, getProducts } from "../services/products";

const mobileOpen = ref(false);
const loading = ref(false);
const filtersLoading = ref(false);
const productsError = ref("");
const filtersError = ref("");
const products = ref([]);
const categories = ref([]);
const brands = ref([]);
const route = useRoute();
const router = useRouter();
const isHydratingFromRoute = ref(false);

const companyId = Number(import.meta.env.VITE_COMPANY_ID || 1);
const defaultProductImage =
  "https://images.unsplash.com/photo-1486401899868-0e435ed85128?auto=format&fit=crop&w=700&q=80";

const pagination = ref({
  page: 1,
  limit: 9,
  totalItems: 0,
  totalPages: 1,
  hasPrevPage: false,
  hasNextPage: false
});

const filters = ref({
  query: "",
  categoryId: "",
  brandId: ""
});

const sortBy = ref("name");
const sortOrder = ref("asc");

const sortByOptions = [
  { value: "name", label: "Nombre" },
  { value: "price", label: "Precio" },
  { value: "stock", label: "Stock" }
];

const sortOrderOptions = [
  { value: "asc", label: "Ascendente" },
  { value: "desc", label: "Descendente" }
];

const pageSizeOptions = [
  { value: "9", label: "9 por pagina" },
  { value: "18", label: "18 por pagina" },
  { value: "36", label: "36 por pagina" }
];

const categoryOptions = computed(() => {
  return categories.value.map((item) => ({
    value: String(item.id),
    label: item.name
  }));
});

const brandOptions = computed(() => {
  return brands.value.map((item) => ({
    value: String(item.id),
    label: item.name
  }));
});

const totalResultsText = computed(() => {
  const total = pagination.value.totalItems;
  return `${total} resultado${total === 1 ? "" : "s"}`;
});

const paginationSummaryText = computed(() => {
  const total = Number(pagination.value.totalItems || 0);
  const page = Number(pagination.value.page || 1);
  const limit = Number(pagination.value.limit || 9);
  const currentItems = Number(products.value.length || 0);

  if (total <= 0 || currentItems <= 0) {
    return "Mostrando 0 de 0 resultados";
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(start + currentItems - 1, total);

  return `Mostrando ${start}-${end} de ${total} resultados`;
});

const skeletonCards = computed(() => {
  const total = Math.max(3, Math.min(12, Number(pagination.value.limit || 9)));
  return Array.from({ length: total }, (_, index) => index + 1);
});

const paginationTokens = computed(() => {
  const total = pagination.value.totalPages || 1;
  const current = pagination.value.page || 1;

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => ({
      type: "page",
      value: index + 1,
      key: `page-${index + 1}`
    }));
  }

  const rawTokens = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) {
    rawTokens.push("ellipsis-left");
  }

  for (let page = start; page <= end; page += 1) {
    rawTokens.push(page);
  }

  if (end < total - 1) {
    rawTokens.push("ellipsis-right");
  }

  rawTokens.push(total);

  return rawTokens.map((token, index) => {
    if (typeof token === "number") {
      return {
        type: "page",
        value: token,
        key: `page-${token}`
      };
    }

    return {
      type: "ellipsis",
      value: "...",
      key: `ellipsis-${index}`
    };
  });
});

let queryDebounce = null;
let activeRequestId = 0;

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parsePageSize(value, fallback = 9) {
  const parsed = parsePositiveInteger(value, fallback);
  return [9, 18, 36].includes(parsed) ? parsed : fallback;
}

function normalizeQueryValue(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function buildRouteQueryFromState() {
  const query = {};

  if (filters.value.query.trim()) {
    query.q = filters.value.query.trim();
  }

  if (filters.value.categoryId) {
    query.categoryId = String(filters.value.categoryId);
  }

  if (filters.value.brandId) {
    query.brandId = String(filters.value.brandId);
  }

  if (pagination.value.page > 1) {
    query.page = String(pagination.value.page);
  }

  if (pagination.value.limit !== 9) {
    query.limit = String(pagination.value.limit);
  }

  if (sortBy.value !== "name") {
    query.sortBy = sortBy.value;
  }

  if (sortOrder.value !== "asc") {
    query.sortOrder = sortOrder.value;
  }

  return query;
}

function isSameQuery(currentQuery, nextQuery) {
  const currentKeys = Object.keys(currentQuery);
  const nextKeys = Object.keys(nextQuery);

  if (currentKeys.length !== nextKeys.length) {
    return false;
  }

  return nextKeys.every((key) => String(currentQuery[key]) === String(nextQuery[key]));
}

function hydrateStateFromRoute() {
  const query = route.query;

  filters.value.query = normalizeQueryValue(query.q, "");
  filters.value.categoryId = normalizeQueryValue(query.categoryId, "");
  filters.value.brandId = normalizeQueryValue(query.brandId, "");

  pagination.value.page = parsePositiveInteger(query.page, 1);
  pagination.value.limit = parsePageSize(query.limit, 9);

  const nextSortBy = normalizeQueryValue(query.sortBy, "name");
  sortBy.value = ["name", "price", "stock"].includes(nextSortBy) ? nextSortBy : "name";

  const nextSortOrder = normalizeQueryValue(query.sortOrder, "asc");
  sortOrder.value = ["asc", "desc"].includes(nextSortOrder) ? nextSortOrder : "asc";
}

async function syncRouteWithState() {
  const nextQuery = buildRouteQueryFromState();

  if (isSameQuery(route.query, nextQuery)) {
    await loadProducts();
    return;
  }

  await router.replace({ query: nextQuery });
}

function getStockClass(stock) {
  const numericStock = Number(stock || 0);
  if (numericStock <= 10) return "stock-low";
  if (numericStock <= 30) return "stock-medium";
  return "stock-high";
}

function normalizeProducts(items) {
  return items.map((item) => ({
    ...item,
    imageUrl: item.imageUrl || defaultProductImage,
    stock: Number(item.stock || 0),
    price: Number(item.price || 0)
  }));
}

async function loadProducts() {
  const requestId = ++activeRequestId;
  loading.value = true;
  productsError.value = "";

  try {
    const response = await getProducts({
      companyId,
      query: filters.value.query,
      categoryId: filters.value.categoryId,
      brandId: filters.value.brandId,
      page: pagination.value.page,
      limit: pagination.value.limit,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    });

    if (requestId !== activeRequestId) {
      return;
    }

    products.value = normalizeProducts(response.items || []);
    pagination.value = {
      ...pagination.value,
      ...(response.pagination || {})
    };
  } catch (error) {
    if (requestId !== activeRequestId) {
      return;
    }

    const message = error?.response?.data?.message || "No fue posible cargar productos. Intenta nuevamente.";
    products.value = [];
    productsError.value = String(message);
  } finally {
    if (requestId === activeRequestId) {
      loading.value = false;
    }
  }
}

async function loadFilters() {
  filtersLoading.value = true;
  filtersError.value = "";

  try {
    const response = await getProductFilters({ companyId });
    categories.value = Array.isArray(response.categories) ? response.categories : [];
    brands.value = Array.isArray(response.brands) ? response.brands : [];
  } catch (error) {
    const message = error?.response?.data?.message || "No fue posible cargar categorias y marcas.";
    categories.value = [];
    brands.value = [];
    filtersError.value = String(message);
  } finally {
    filtersLoading.value = false;
  }
}

async function goToPage(nextPage) {
  const boundedPage = Math.min(Math.max(nextPage, 1), pagination.value.totalPages || 1);
  if (boundedPage === pagination.value.page) return;
  pagination.value.page = boundedPage;
  await syncRouteWithState();
}

async function onFilterSelectChange() {
  pagination.value.page = 1;
  await syncRouteWithState();
}

function onSearchInput() {
  if (queryDebounce) {
    clearTimeout(queryDebounce);
  }

  queryDebounce = setTimeout(() => {
    pagination.value.page = 1;
    syncRouteWithState();
  }, 350);
}

async function retryFilters() {
  await loadFilters();
}

async function retryProducts() {
  await loadProducts();
}

async function onSortChange() {
  pagination.value.page = 1;
  await syncRouteWithState();
}

async function onPageSizeChange() {
  pagination.value.page = 1;
  await syncRouteWithState();
}

onMounted(async () => {
  hydrateStateFromRoute();
  await loadFilters();
  await loadProducts();

  watch(
    () => route.query,
    async () => {
      if (isHydratingFromRoute.value) {
        return;
      }

      isHydratingFromRoute.value = true;
      hydrateStateFromRoute();
      isHydratingFromRoute.value = false;
      await loadProducts();
    }
  );
});

onBeforeUnmount(() => {
  if (queryDebounce) {
    clearTimeout(queryDebounce);
  }
});
</script>

<template>
  <div class="site-shell">
    <header class="site-navbar">
      <nav class="container-wrap nav-content" aria-label="Main navigation">
        <a href="#home" class="brand-mark" aria-label="Integra360 Home">
          <span class="brand-ring">I360</span>
          <span class="brand-text">Integra360</span>
        </a>

        <button
          class="menu-toggle"
          type="button"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-nav"
          @click="mobileOpen = !mobileOpen"
        >
          Menu
        </button>

        <ul class="nav-links" :class="{ open: mobileOpen }" id="mobile-nav">
          <li><a href="#home" @click="mobileOpen = false">Home</a></li>
          <li><a href="#contacto" @click="mobileOpen = false">Contacto</a></li>
          <li><a href="#registro" @click="mobileOpen = false">Registrarse</a></li>
          <li>
            <RouterLink :to="{ name: 'login' }" @click="mobileOpen = false">Inicio de Sesion</RouterLink>
          </li>
        </ul>
      </nav>
    </header>

    <main>
      <section id="home" class="hero-section">
        <div class="container-wrap hero-grid">
          <div>
            <p class="kicker">Catalogo Empresarial</p>
            <h1>Encuentra productos mas rapido con filtros inteligentes</h1>
            <p class="hero-copy">
              Navega un catalogo moderno, responsivo y optimizado para escritorio, tablet y movil.
            </p>
            <a href="#catalogo" class="hero-cta">Explorar Catalogo</a>
          </div>
          <div class="hero-highlight glass-card">
            <p class="highlight-label">Disponibilidad en tiempo real</p>
            <p class="highlight-value">+2,400 SKU activos</p>
            <p class="highlight-meta">Actualizado cada 15 minutos</p>
          </div>
        </div>
      </section>

      <section class="container-wrap filters-section" id="catalogo">
        <div class="filters-header">
          <h2>Busqueda avanzada</h2>
          <p>Filtra por SKU, nombre o descripcion, ademas de categoria y marca.</p>
        </div>

        <p v-if="filtersLoading" class="filters-loading">Cargando filtros...</p>

        <div v-if="filtersError" class="state-error state-error-soft">
          <p>{{ filtersError }}</p>
          <button type="button" class="btn btn-outline-primary" @click="retryFilters">Reintentar filtros</button>
        </div>

        <div class="filters-grid glass-card">
          <div>
            <label class="mb-1 block text-sm font-semibold text-on-surface" for="search">Buscar producto</label>
            <input
              id="search"
              v-model="filters.query"
              type="search"
              class="form-control"
              placeholder="SKU, nombre o descripcion"
              @input="onSearchInput"
            />
          </div>

          <AppAdvancedSelect
            id="category-filter"
            v-model="filters.categoryId"
            label="Categoria"
            :options="categoryOptions"
            placeholder="Todas las categorias"
            @update:modelValue="onFilterSelectChange"
          />

          <AppAdvancedSelect
            id="brand-filter"
            v-model="filters.brandId"
            label="Marca"
            :options="brandOptions"
            placeholder="Todas las marcas"
            @update:modelValue="onFilterSelectChange"
          />

          <AppAdvancedSelect
            id="sort-by-filter"
            v-model="sortBy"
            label="Ordenar por"
            :options="sortByOptions"
            placeholder="Ordenar por"
            @update:modelValue="onSortChange"
          />

          <AppAdvancedSelect
            id="sort-order-filter"
            v-model="sortOrder"
            label="Direccion"
            :options="sortOrderOptions"
            placeholder="Direccion"
            @update:modelValue="onSortChange"
          />

          <AppAdvancedSelect
            id="page-size-filter"
            :model-value="String(pagination.limit)"
            label="Tamano de pagina"
            :options="pageSizeOptions"
            placeholder="Tamano de pagina"
            @update:modelValue="(value) => { pagination.limit = Number(value || 9); onPageSizeChange(); }"
          />
        </div>
      </section>

      <section class="container-wrap products-section">
        <div class="section-title-row">
          <h2>Catalogo de productos</h2>
          <span class="results-pill">{{ totalResultsText }}</span>
        </div>

        <p v-if="!loading && !productsError" class="results-summary">{{ paginationSummaryText }}</p>

        <div v-if="loading" class="skeleton-grid" aria-label="Cargando productos">
          <article v-for="skeleton in skeletonCards" :key="skeleton" class="skeleton-card">
            <div class="skeleton-media"></div>
            <div class="skeleton-content">
              <div class="skeleton-line skeleton-line-sm"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line skeleton-line-short"></div>
            </div>
          </article>
        </div>

        <div v-else-if="productsError" class="state-error">
          <p>{{ productsError }}</p>
          <button type="button" class="btn btn-primary" @click="retryProducts">Reintentar catalogo</button>
        </div>

        <div v-else-if="products.length" class="products-grid">
          <article v-for="product in products" :key="product.id" class="product-card">
            <div class="product-media">
              <img :src="product.imageUrl" :alt="product.name" loading="lazy" />
            </div>

            <div class="product-content">
              <p class="product-sku">SKU: {{ product.sku }}</p>
              <h3>{{ product.name }}</h3>
              <p class="product-description">{{ product.description }}</p>
              <p class="product-tags">
                <span>{{ product.categoryName || "Sin categoria" }}</span>
                <span>{{ product.brandName || "Sin marca" }}</span>
              </p>

              <div class="product-meta">
                <div>
                  <p class="meta-label">Precio</p>
                  <p class="price">${{ Number(product.price).toFixed(2) }}</p>
                </div>
                <div>
                  <p class="meta-label">Stock</p>
                  <p class="stock" :class="getStockClass(product.stock)">{{ product.stock }} unidades</p>
                </div>
              </div>
            </div>
          </article>
        </div>

        <p v-else class="empty-state">
          No se encontraron productos con los filtros actuales. Ajusta criterios y vuelve a intentar.
        </p>

        <div v-if="pagination.totalPages > 1" class="pagination-row">
          <button
            type="button"
            class="btn btn-outline-primary"
            :disabled="!pagination.hasPrevPage || loading"
            @click="goToPage(pagination.page - 1)"
          >
            Anterior
          </button>

          <p class="pagination-label">Pagina {{ pagination.page }} de {{ pagination.totalPages }}</p>

          <div class="pagination-pages" aria-label="Paginacion numerica">
            <template v-for="token in paginationTokens" :key="token.key">
              <span v-if="token.type === 'ellipsis'" class="page-ellipsis">...</span>
              <button
                v-else
                type="button"
                class="page-number"
                :class="{ active: token.value === pagination.page }"
                :disabled="loading"
                @click="goToPage(token.value)"
              >
                {{ token.value }}
              </button>
            </template>
          </div>

          <button
            type="button"
            class="btn btn-outline-primary"
            :disabled="!pagination.hasNextPage || loading"
            @click="goToPage(pagination.page + 1)"
          >
            Siguiente
          </button>
        </div>
      </section>
    </main>

    <footer class="site-footer" id="contacto">
      <div class="container-wrap footer-grid">
        <div>
          <h3>Integra360</h3>
          <p>
            Plataforma para gestion comercial con una experiencia moderna, consistente y enfocada en
            productividad.
          </p>
        </div>

        <div>
          <h4>Contacto</h4>
          <ul>
            <li>+57 300 000 0000</li>
            <li>contacto@integra360.com</li>
            <li>Bogota, Colombia</li>
          </ul>
        </div>

        <div id="registro">
          <h4>Acciones rapidas</h4>
          <ul>
            <li><a href="#home">Ir al inicio</a></li>
            <li><a href="#catalogo">Ver catalogo</a></li>
            <li><RouterLink :to="{ name: 'login' }">Inicio de Sesion</RouterLink></li>
          </ul>
        </div>
      </div>
      <p class="footer-copy">(c) 2026 Integra360. Todos los derechos reservados.</p>
    </footer>
  </div>
</template>

<style scoped>
.site-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at 10% 12%, rgba(23, 54, 232, 0.1), transparent 40%),
    radial-gradient(circle at 85% 85%, rgba(230, 25, 97, 0.12), transparent 38%),
    linear-gradient(180deg, #f8fbff, #eef3ff 48%, #ffffff);
  color: var(--color-on-surface);
}

.container-wrap {
  width: min(1140px, calc(100% - 2rem));
  margin-inline: auto;
}

.site-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 120;
  backdrop-filter: blur(10px);
  background: color-mix(in srgb, var(--color-surface-elevated) 84%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--color-surface-border) 75%, transparent);
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  gap: 1rem;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--color-on-surface);
  font-weight: 700;
}

.brand-ring {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 9999px;
  color: white;
  background: linear-gradient(140deg, var(--color-primary), var(--color-secondary));
  box-shadow: 0 8px 22px rgba(23, 54, 232, 0.3);
  font-size: 0.8rem;
}

.brand-text {
  letter-spacing: 0.02em;
  font-size: 1rem;
}

.nav-links {
  display: flex;
  align-items: center;
  list-style: none;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
}

.nav-links a {
  display: inline-flex;
  text-decoration: none;
  color: var(--color-on-surface);
  font-weight: 600;
  padding: 0.55rem 0.9rem;
  border-radius: 9999px;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.nav-links a:hover,
.nav-links a:focus-visible {
  background: color-mix(in srgb, var(--color-primary) 12%, white);
  color: var(--color-primary);
  transform: translateY(-1px);
  outline: none;
}

.menu-toggle {
  display: none;
  border: 1px solid var(--color-surface-border);
  border-radius: 9999px;
  background: white;
  color: var(--color-on-surface);
  padding: 0.45rem 0.9rem;
  font-weight: 600;
}

.hero-section {
  padding: 7.2rem 0 2.8rem;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 1.6rem;
  align-items: center;
}

.kicker {
  margin: 0;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-on-surface-muted);
  font-weight: 700;
}

.hero-section h1 {
  margin-top: 0.7rem;
  margin-bottom: 1rem;
  font-size: clamp(2rem, 5vw, 3.4rem);
  line-height: 1.02;
}

.hero-copy {
  margin: 0;
  max-width: 62ch;
  color: var(--color-on-surface-muted);
  font-size: 1.03rem;
}

.hero-cta {
  margin-top: 1.45rem;
  display: inline-flex;
  text-decoration: none;
  color: var(--color-on-surface-inverse);
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  padding: 0.72rem 1.2rem;
  border-radius: 9999px;
  font-weight: 700;
  transition: transform 0.2s ease, box-shadow 0.25s ease;
}

.hero-cta:hover,
.hero-cta:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(23, 54, 232, 0.25);
  outline: none;
}

.hero-highlight {
  padding: 1.5rem;
}

.highlight-label {
  margin: 0;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-on-surface-muted);
  font-weight: 700;
}

.highlight-value {
  margin: 0.75rem 0 0;
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  color: var(--color-primary);
  font-weight: 800;
}

.highlight-meta {
  margin-top: 0.6rem;
  margin-bottom: 0;
  color: var(--color-on-surface-muted);
}

.filters-section,
.products-section {
  padding: 1rem 0 2rem;
}

.filters-header h2,
.section-title-row h2 {
  margin: 0;
  font-size: clamp(1.4rem, 2.4vw, 2rem);
}

.filters-header p {
  margin-top: 0.45rem;
  margin-bottom: 0;
  color: var(--color-on-surface-muted);
}

.filters-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
}

.filters-loading {
  margin-top: 0.75rem;
  margin-bottom: 0;
  color: var(--color-on-surface-muted);
  font-size: 0.92rem;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.results-pill {
  background: color-mix(in srgb, var(--color-secondary) 12%, white);
  color: var(--color-secondary);
  border-radius: 9999px;
  padding: 0.35rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 700;
}

.results-summary {
  margin-top: 0.65rem;
  margin-bottom: 0;
  color: var(--color-on-surface-muted);
  font-size: 0.9rem;
  font-weight: 600;
}

.products-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.product-card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.product-card:hover,
.product-card:focus-within {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--color-primary) 35%, white);
  box-shadow: var(--shadow-card);
}

.product-media {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--color-surface-soft);
}

.product-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.product-card:hover .product-media img {
  transform: scale(1.04);
}

.product-content {
  padding: 1rem;
}

.product-sku {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-on-surface-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.product-content h3 {
  margin: 0.45rem 0 0;
  font-size: 1.1rem;
}

.product-description {
  margin-top: 0.55rem;
  margin-bottom: 0;
  color: var(--color-on-surface-muted);
  font-size: 0.95rem;
  line-height: 1.35;
  min-height: 2.6rem;
}

.product-tags {
  margin-top: 0.7rem;
  margin-bottom: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.product-tags span {
  font-size: 0.75rem;
  padding: 0.25rem 0.55rem;
  border-radius: 9999px;
  color: var(--color-on-surface-muted);
  background: color-mix(in srgb, var(--color-surface-soft) 70%, white);
  border: 1px solid var(--color-surface-border);
}

.product-meta {
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.meta-label {
  margin: 0;
  color: var(--color-on-surface-muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.price {
  margin-top: 0.2rem;
  margin-bottom: 0;
  font-weight: 800;
  color: var(--color-primary);
}

.stock {
  margin-top: 0.2rem;
  margin-bottom: 0;
  font-weight: 700;
}

.stock-low {
  color: var(--color-danger);
}

.stock-medium {
  color: var(--color-warning);
}

.stock-high {
  color: #157347;
}

.empty-state {
  margin-top: 1rem;
  color: var(--color-on-surface-muted);
  background: color-mix(in srgb, var(--color-surface-soft) 70%, white);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-lg);
  padding: 1rem;
}

.state-error {
  margin-top: 1rem;
  border: 1px solid color-mix(in srgb, var(--color-danger) 28%, white);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-danger) 9%, white);
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.state-error p {
  margin: 0;
  color: color-mix(in srgb, var(--color-danger) 70%, #3b0a0a);
  font-weight: 600;
}

.state-error-soft {
  margin-top: 0.9rem;
}

.skeleton-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.skeleton-card {
  position: relative;
  overflow: hidden;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-lg);
}

.skeleton-card::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.55) 50%, rgba(255, 255, 255, 0) 100%);
  animation: skeleton-sweep 1.25s infinite;
}

.skeleton-media {
  aspect-ratio: 16 / 10;
  background: color-mix(in srgb, var(--color-surface-soft) 65%, white);
}

.skeleton-content {
  padding: 1rem;
}

.skeleton-line {
  height: 0.82rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-surface-soft) 78%, white);
  margin-bottom: 0.55rem;
}

.skeleton-line-sm {
  width: 46%;
}

.skeleton-line-short {
  width: 64%;
  margin-bottom: 0;
}

@keyframes skeleton-sweep {
  100% {
    transform: translateX(100%);
  }
}

.pagination-row {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.pagination-label {
  margin: 0;
  color: var(--color-on-surface-muted);
  font-weight: 600;
}

.pagination-pages {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  justify-content: center;
}

.page-number {
  min-width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.6rem;
  border: 1px solid var(--color-surface-border);
  background: var(--color-surface-elevated);
  color: var(--color-on-surface);
  font-weight: 700;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.page-number:hover,
.page-number:focus-visible {
  border-color: var(--color-primary);
  outline: none;
}

.page-number.active {
  background: var(--color-primary);
  color: var(--color-on-surface-inverse);
  border-color: var(--color-primary);
}

.page-ellipsis {
  color: var(--color-on-surface-muted);
  min-width: 1.2rem;
  text-align: center;
}

.site-footer {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid color-mix(in srgb, var(--color-surface-border) 70%, transparent);
  background: color-mix(in srgb, var(--color-primary) 6%, white);
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 1rem;
}

.footer-grid h3,
.footer-grid h4 {
  margin-top: 0;
  margin-bottom: 0.55rem;
}

.footer-grid p,
.footer-grid li {
  margin: 0;
  color: var(--color-on-surface-muted);
  line-height: 1.4;
}

.footer-grid ul {
  padding: 0;
  margin: 0;
  list-style: none;
  display: grid;
  gap: 0.4rem;
}

.footer-grid a {
  color: var(--color-primary);
  text-decoration: none;
}

.footer-grid a:hover,
.footer-grid a:focus-visible {
  text-decoration: underline;
  outline: none;
}

.footer-copy {
  margin-top: 1.2rem;
  margin-bottom: 0;
  padding: 0.85rem 1rem 1.1rem;
  text-align: center;
  color: var(--color-on-surface-muted);
  border-top: 1px solid color-mix(in srgb, var(--color-surface-border) 70%, transparent);
}

@media (max-width: 1024px) {
  .hero-grid,
  .products-grid,
  .skeleton-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filters-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .filters-grid > :first-child {
    grid-column: span 3;
  }

  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 760px) {
  .menu-toggle {
    display: inline-flex;
  }

  .nav-links {
    display: none;
    position: absolute;
    top: 72px;
    left: 1rem;
    right: 1rem;
    flex-direction: column;
    align-items: stretch;
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-surface-border);
    border-radius: var(--radius-md);
    padding: 0.5rem;
    box-shadow: var(--shadow-soft);
  }

  .nav-links.open {
    display: flex;
  }

  .nav-links a {
    width: 100%;
    border-radius: var(--radius-sm);
  }

  .hero-section {
    padding-top: 3.3rem;
  }

  .hero-grid,
  .filters-grid,
  .products-grid,
  .skeleton-grid,
  .footer-grid {
    grid-template-columns: 1fr;
  }

  .filters-grid > :first-child {
    grid-column: span 1;
  }

  .pagination-row {
    flex-direction: column;
  }

  .state-error {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-title-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
