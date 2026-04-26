<script setup>
import { onMounted, ref } from "vue";
import MainLayout from "../layouts/MainLayout.vue";
import AppChart from "../components/common/AppChart.vue";
import { useAuthStore } from "../store/auth";
import { useToast } from "../composables/useToast";
import { getProducts } from "../services/products";
import {
  deleteProductImage,
  listProductImages,
  markPrimaryProductImage,
  updateProductImage,
  uploadProductImage
} from "../services/productImages";

const authStore = useAuthStore();
const toast = useToast();
const labels = ref(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);
const values = ref([3400, 4100, 3900, 5100, 6200, 7100]);
const products = ref([]);
const productsLoading = ref(false);
const imagesLoading = ref(false);
const uploadLoading = ref(false);
const selectedProductId = ref("");
const images = ref([]);
const companyId = Number(import.meta.env.VITE_COMPANY_ID || 1);

const uploadForm = ref({
  purpose: "GALLERY",
  altText: "",
  sortOrder: "",
  isPrimary: false,
  file: null
});

function imagePreviewUrl(image) {
  const rawUrl = image?.asset?.publicUrl;
  if (!rawUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
  const origin = apiBase.replace(/\/api\/v1\/?$/, "");
  return `${origin}${rawUrl}`;
}

function resetUploadForm() {
  uploadForm.value = {
    purpose: "GALLERY",
    altText: "",
    sortOrder: "",
    isPrimary: false,
    file: null
  };
}

async function loadProductsForManager() {
  productsLoading.value = true;

  try {
    const response = await getProducts({
      companyId,
      limit: 36,
      page: 1,
      sortBy: "name",
      sortOrder: "asc"
    });

    products.value = response.items || [];

    if (!selectedProductId.value && products.value.length > 0) {
      selectedProductId.value = String(products.value[0].id);
    }
  } catch (error) {
    const message = error?.response?.data?.message || "No fue posible cargar el listado de productos.";
    toast.error(String(message));
  } finally {
    productsLoading.value = false;
  }
}

async function loadImages() {
  if (!selectedProductId.value) {
    images.value = [];
    return;
  }

  imagesLoading.value = true;

  try {
    images.value = await listProductImages(selectedProductId.value);
  } catch (error) {
    const message = error?.response?.data?.message || "No fue posible cargar las imagenes del producto.";
    toast.error(String(message));
    images.value = [];
  } finally {
    imagesLoading.value = false;
  }
}

function onFileChange(event) {
  const [file] = event.target.files || [];
  uploadForm.value.file = file || null;
}

async function submitImageUpload() {
  if (!selectedProductId.value) {
    toast.error("Selecciona un producto para subir imagenes.");
    return;
  }

  if (!uploadForm.value.file) {
    toast.error("Selecciona un archivo de imagen.");
    return;
  }

  uploadLoading.value = true;

  try {
    await uploadProductImage(selectedProductId.value, {
      file: uploadForm.value.file,
      purpose: uploadForm.value.purpose,
      altText: uploadForm.value.altText,
      sortOrder: uploadForm.value.sortOrder ? Number(uploadForm.value.sortOrder) : undefined,
      isPrimary: uploadForm.value.isPrimary
    });

    toast.success("Imagen subida correctamente.");
    resetUploadForm();
    await loadImages();
  } catch (error) {
    const message = error?.response?.data?.message || "No fue posible subir la imagen.";
    toast.error(String(message));
  } finally {
    uploadLoading.value = false;
  }
}

async function makePrimary(imageId) {
  if (!selectedProductId.value) return;

  try {
    await markPrimaryProductImage(selectedProductId.value, imageId);
    toast.success("Imagen principal actualizada.");
    await loadImages();
  } catch (error) {
    const message = error?.response?.data?.message || "No fue posible establecer imagen principal.";
    toast.error(String(message));
  }
}

async function saveImageMetadata(image) {
  if (!selectedProductId.value) return;

  try {
    await updateProductImage(selectedProductId.value, image.id, {
      altText: image.altText || null,
      sortOrder: Number(image.sortOrder || 1)
    });
    toast.success("Metadatos actualizados.");
    await loadImages();
  } catch (error) {
    const message = error?.response?.data?.message || "No fue posible actualizar la imagen.";
    toast.error(String(message));
  }
}

async function removeImage(imageId) {
  if (!selectedProductId.value) return;

  try {
    await deleteProductImage(selectedProductId.value, imageId);
    toast.success("Imagen eliminada.");
    await loadImages();
  } catch (error) {
    const message = error?.response?.data?.message || "No fue posible eliminar la imagen.";
    toast.error(String(message));
  }
}

onMounted(async () => {
  if (!authStore.profile) {
    await authStore.fetchProfile();
  }

  await loadProductsForManager();
  await loadImages();
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

    <section class="glass-card spacing-section rounded-panel p-card shadow-panel">
      <div class="manager-header">
        <div>
          <h2 class="font-display text-xl">Gestor de Imagenes de Productos</h2>
          <p class="manager-subtitle">Sube imagenes, define portada y administra metadatos por producto.</p>
        </div>
      </div>

      <div class="manager-controls">
        <label class="manager-label" for="product-selector">Producto</label>
        <select
          id="product-selector"
          v-model="selectedProductId"
          class="form-select"
          :disabled="productsLoading"
          @change="loadImages"
        >
          <option value="">Selecciona un producto</option>
          <option v-for="product in products" :key="product.id" :value="String(product.id)">
            {{ product.sku }} - {{ product.name }}
          </option>
        </select>
      </div>

      <form class="upload-panel" @submit.prevent="submitImageUpload">
        <div>
          <label class="manager-label" for="upload-purpose">Tipo</label>
          <select id="upload-purpose" v-model="uploadForm.purpose" class="form-select">
            <option value="GALLERY">Galeria</option>
            <option value="PRIMARY">Principal</option>
            <option value="THUMBNAIL">Miniatura</option>
            <option value="DETAIL">Detalle</option>
            <option value="PACKAGING">Empaque</option>
          </select>
        </div>

        <div>
          <label class="manager-label" for="upload-alt-text">Alt Text</label>
          <input id="upload-alt-text" v-model="uploadForm.altText" type="text" class="form-control" />
        </div>

        <div>
          <label class="manager-label" for="upload-sort-order">Orden</label>
          <input id="upload-sort-order" v-model="uploadForm.sortOrder" type="number" min="1" class="form-control" />
        </div>

        <div>
          <label class="manager-label" for="upload-file">Archivo</label>
          <input id="upload-file" type="file" accept="image/*" class="form-control" @change="onFileChange" />
        </div>

        <label class="checkbox-line">
          <input v-model="uploadForm.isPrimary" type="checkbox" />
          <span>Marcar como principal al subir</span>
        </label>

        <button class="btn btn-primary" type="submit" :disabled="uploadLoading || !selectedProductId">
          {{ uploadLoading ? "Subiendo..." : "Subir imagen" }}
        </button>
      </form>

      <p v-if="imagesLoading" class="manager-state">Cargando imagenes...</p>
      <p v-else-if="!selectedProductId" class="manager-state">Selecciona un producto para ver su galeria.</p>
      <p v-else-if="!images.length" class="manager-state">Este producto aun no tiene imagenes.</p>

      <div v-else class="image-grid">
        <article v-for="image in images" :key="image.id" class="image-card">
          <img :src="imagePreviewUrl(image)" :alt="image.altText || 'Imagen de producto'" class="image-preview" />

          <div class="image-content">
            <p class="image-meta">{{ image.purpose }} | Orden {{ image.sortOrder }}</p>
            <p class="image-meta" :class="image.isPrimary ? 'image-primary' : ''">
              {{ image.isPrimary ? "Principal" : "Secundaria" }}
            </p>

            <label class="manager-label" :for="`alt-${image.id}`">Alt Text</label>
            <input :id="`alt-${image.id}`" v-model="image.altText" type="text" class="form-control" />

            <label class="manager-label" :for="`sort-${image.id}`">Orden</label>
            <input :id="`sort-${image.id}`" v-model="image.sortOrder" type="number" min="1" class="form-control" />

            <div class="image-actions">
              <button class="btn btn-outline-primary btn-sm" type="button" @click="saveImageMetadata(image)">
                Guardar
              </button>
              <button
                class="btn btn-outline-primary btn-sm"
                type="button"
                :disabled="image.isPrimary"
                @click="makePrimary(image.id)"
              >
                Principal
              </button>
              <button class="btn btn-danger btn-sm" type="button" @click="removeImage(image.id)">Eliminar</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </MainLayout>
</template>

<style scoped>
.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.manager-subtitle {
  margin: 0.25rem 0 0;
  color: var(--color-on-surface-muted);
}

.manager-controls {
  margin-top: 1rem;
}

.manager-label {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.85rem;
  font-weight: 700;
}

.upload-panel {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  align-items: end;
}

.checkbox-line {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.manager-state {
  margin-top: 1rem;
  color: var(--color-on-surface-muted);
}

.image-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.9rem;
}

.image-card {
  border: 1px solid var(--color-surface-border);
  border-radius: 0.9rem;
  background: var(--color-surface-elevated);
  overflow: hidden;
}

.image-preview {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-bottom: 1px solid var(--color-surface-border);
}

.image-content {
  padding: 0.8rem;
}

.image-meta {
  margin: 0 0 0.4rem;
  font-size: 0.85rem;
  color: var(--color-on-surface-muted);
}

.image-primary {
  color: var(--color-primary);
  font-weight: 700;
}

.image-actions {
  margin-top: 0.8rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

@media (max-width: 768px) {
  .upload-panel {
    grid-template-columns: 1fr;
  }
}
</style>
