<script setup>
import { computed, reactive, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "../store/auth";
import { useToast } from "../composables/useToast";

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();
const passwordVisible = ref(false);

const form = reactive({
  email: "admin@integra360.local",
  password: "Admin123456!"
});

const touched = reactive({
  email: false,
  password: false
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailError = computed(() => {
  const value = form.email.trim();

  if (!value) {
    return "El correo electronico es obligatorio.";
  }

  if (!emailRegex.test(value)) {
    return "Ingresa un correo electronico valido.";
  }

  return "";
});

const passwordError = computed(() => {
  if (!form.password.trim()) {
    return "La contrasena es obligatoria.";
  }

  return "";
});

const isFormInvalid = computed(() => Boolean(emailError.value || passwordError.value));

const showEmailError = computed(() => touched.email && Boolean(emailError.value));
const showPasswordError = computed(() => touched.password && Boolean(passwordError.value));

async function submit() {
  touched.email = true;
  touched.password = true;

  if (isFormInvalid.value) {
    toast.error("Revisa los campos del formulario.");
    return;
  }

  try {
    await authStore.login(form);
    await authStore.fetchProfile();
    toast.success("Welcome back");
    router.push({ name: "dashboard" });
  } catch {
    toast.error("Invalid credentials");
  }
}

function togglePasswordVisibility() {
  passwordVisible.value = !passwordVisible.value;
}

function onEmailInput() {
  if (!touched.email) {
    touched.email = true;
  }
}

function onPasswordInput() {
  if (!touched.password) {
    touched.password = true;
  }
}

function onEmailBlur() {
  touched.email = true;
}

function onPasswordBlur() {
  touched.password = true;
}
</script>

<template>
  <div class="login-page">
    <section class="login-shell">
      <article class="login-brand-panel">
        <p class="panel-kicker">Integra360 Platform</p>
        <h1>Gestion comercial inteligente para equipos que crecen rapido</h1>
        <p class="panel-copy">
          Inicia sesion para acceder a reportes, inventario y operaciones desde una experiencia moderna,
          clara y segura.
        </p>
        <div class="panel-badges" aria-label="Beneficios">
          <span>Control en tiempo real</span>
          <span>Multi-sucursal</span>
          <span>Flujo seguro</span>
        </div>
      </article>

      <article class="login-form-panel glass-card surface-panel">
        <div class="form-header">
          <h2>Inicio de sesion</h2>
          <p>Ingresa a tu espacio de trabajo con tus credenciales corporativas.</p>
        </div>

        <form class="form-grid" @submit.prevent="submit">
          <div>
            <label class="form-label" for="email">Correo electronico</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-control"
              :class="{ 'is-invalid-field': showEmailError }"
              autocomplete="email"
              :aria-invalid="showEmailError"
              required
              @input="onEmailInput"
              @blur="onEmailBlur"
            />
            <p v-if="showEmailError" class="field-error">
              <span class="field-error-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm0 14.2a1.2 1.2 0 1 1-1.2 1.2 1.2 1.2 0 0 1 1.2-1.2Zm1.1-3.4a1.1 1.1 0 0 1-2.2 0V7.6a1.1 1.1 0 0 1 2.2 0Z" />
                </svg>
              </span>
              <span>{{ emailError }}</span>
            </p>
          </div>

          <div>
            <label class="form-label" for="password">Contrasena</label>
            <div class="password-field">
              <input
                id="password"
                v-model="form.password"
                :type="passwordVisible ? 'text' : 'password'"
                class="form-control password-input"
                :class="{ 'is-invalid-field': showPasswordError }"
                autocomplete="current-password"
                :aria-invalid="showPasswordError"
                required
                @input="onPasswordInput"
                @blur="onPasswordBlur"
              />
              <button
                type="button"
                class="eye-toggle"
                :aria-label="passwordVisible ? 'Ocultar contrasena' : 'Mostrar contrasena'"
                :title="passwordVisible ? 'Ocultar contrasena' : 'Mostrar contrasena'"
                @click="togglePasswordVisibility"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    v-if="passwordVisible"
                    d="M12 5c-5.23 0-9.76 3.11-11.86 7.5A13.71 13.71 0 0 0 4.1 17.4l-1.39 1.4a1 1 0 1 0 1.41 1.41l16-16a1 1 0 1 0-1.41-1.41l-2.07 2.06A13.64 13.64 0 0 0 12 5Zm0 2c1.5 0 2.9.39 4.1 1.06l-1.77 1.77A4 4 0 0 0 10.83 13l-1.89 1.89A6 6 0 0 1 12 7Zm8.66 4.85a13.63 13.63 0 0 1-3.34 4.73l-1.43-1.43A4 4 0 0 0 12 9.34l-1.62 1.62-1.47 1.47-2.12 2.12A13.57 13.57 0 0 1 3.28 12.5C5.14 9.03 8.35 7 12 7c1.06 0 2.08.17 3.04.48l1.58-1.58c-1.44-.58-3-.9-4.62-.9-5.23 0-9.76 3.11-11.86 7.5a13.63 13.63 0 0 0 4.45 5.24L2.7 19.63a1 1 0 0 0 1.41 1.41l16-16a1 1 0 1 0-1.41-1.41l-2.04 2.04c1.72 1.34 3.11 3.11 4 5.18Z"
                  />
                  <path
                    v-else
                    d="M12 5c-5.23 0-9.76 3.11-11.86 7.5C2.24 16.89 6.77 20 12 20s9.76-3.11 11.86-7.5C21.76 8.11 17.23 5 12 5Zm0 13c-3.65 0-6.86-2.03-8.72-5.5C5.14 9.03 8.35 7 12 7s6.86 2.03 8.72 5.5C18.86 15.97 15.65 18 12 18Zm0-9a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
                  />
                </svg>
              </button>
            </div>
            <p v-if="showPasswordError" class="field-error">
              <span class="field-error-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm0 14.2a1.2 1.2 0 1 1-1.2 1.2 1.2 1.2 0 0 1 1.2-1.2Zm1.1-3.4a1.1 1.1 0 0 1-2.2 0V7.6a1.1 1.1 0 0 1 2.2 0Z" />
                </svg>
              </span>
              <span>{{ passwordError }}</span>
            </p>
          </div>

          <button type="submit" class="btn btn-primary w-100 btn-login" :disabled="authStore.loading || isFormInvalid">
            {{ authStore.loading ? "Ingresando..." : "Iniciar sesion" }}
          </button>
        </form>

        <div class="home-link-wrap">
          <RouterLink :to="{ name: 'home' }" class="home-link">Volver a la pagina principal</RouterLink>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: clamp(1rem, 2vw, 1.5rem);
  background:
    radial-gradient(circle at 8% 12%, rgba(23, 54, 232, 0.16), transparent 35%),
    radial-gradient(circle at 92% 90%, rgba(230, 25, 97, 0.15), transparent 38%),
    linear-gradient(160deg, #eef3ff, #f8fbff 45%, #ffffff);
  display: grid;
  place-items: center;
}

.login-shell {
  width: min(1100px, 100%);
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  box-shadow: var(--shadow-elevated);
  border: 1px solid color-mix(in srgb, var(--color-surface-border) 70%, transparent);
  background: color-mix(in srgb, var(--color-surface-elevated) 90%, transparent);
}

.login-brand-panel {
  padding: clamp(1.5rem, 3vw, 2.6rem);
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--color-primary) 92%, #09165d), color-mix(in srgb, var(--color-secondary) 58%, #050b2e));
  color: var(--color-on-surface-inverse);
  display: grid;
  align-content: center;
  gap: 1rem;
}

.panel-kicker {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  font-size: 0.8rem;
  color: color-mix(in srgb, white 84%, transparent);
}

.login-brand-panel h1 {
  margin: 0;
  font-family: "Quicksand", ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(1.65rem, 3.2vw, 2.6rem);
  line-height: 1.05;
}

.panel-copy {
  margin: 0;
  color: color-mix(in srgb, white 82%, transparent);
  max-width: 48ch;
}

.panel-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.panel-badges span {
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.35rem 0.65rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, white 24%, transparent);
  background: color-mix(in srgb, white 12%, transparent);
}

.login-form-panel {
  padding: clamp(1.25rem, 3vw, 2.25rem);
  display: grid;
  align-content: center;
  gap: 1.1rem;
}

.form-header h2 {
  margin: 0;
  font-size: clamp(1.45rem, 2vw, 2rem);
  color: var(--color-on-surface);
}

.form-header p {
  margin: 0.35rem 0 0;
  color: var(--color-on-surface-muted);
}

.form-grid {
  display: grid;
  gap: 0.9rem;
}

.form-label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-on-surface);
}

.field-error {
  margin: 0.35rem 0 0;
  color: var(--color-danger);
  font-size: 0.82rem;
  font-weight: 600;
  display: inline-flex;
  align-items: flex-start;
  gap: 0.38rem;
  line-height: 1.35;
}

.field-error-icon {
  width: 0.95rem;
  height: 0.95rem;
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  margin-top: 0.02rem;
}

.field-error-icon svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.password-field {
  position: relative;
}

.is-invalid-field {
  border-color: color-mix(in srgb, var(--color-danger) 55%, white);
  box-shadow: 0 0 0 0.25rem color-mix(in srgb, var(--color-danger) 16%, transparent);
}

.password-input {
  padding-right: 2.8rem;
}

.eye-toggle {
  position: absolute;
  right: 0.35rem;
  top: 50%;
  transform: translateY(-50%);
  width: 2.2rem;
  height: 2.2rem;
  border: none;
  border-radius: 0.65rem;
  background: transparent;
  color: var(--color-on-surface-muted);
  display: grid;
  place-items: center;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.eye-toggle:hover,
.eye-toggle:focus-visible {
  background: color-mix(in srgb, var(--color-primary) 12%, white);
  color: var(--color-primary);
  outline: none;
}

.eye-toggle svg {
  width: 1.15rem;
  height: 1.15rem;
  fill: currentColor;
}

.btn-login {
  margin-top: 0.35rem;
  min-height: 44px;
  font-weight: 700;
}

.home-link-wrap {
  margin-top: 0.25rem;
}

.home-link {
  color: var(--color-primary);
  font-weight: 700;
  text-decoration: none;
}

.home-link:hover,
.home-link:focus-visible {
  color: var(--color-ink-black-700);
  text-decoration: underline;
  outline: none;
}

@media (max-width: 920px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .login-brand-panel {
    min-height: 220px;
  }
}

@media (max-width: 560px) {
  .login-page {
    padding: 0.75rem;
  }

  .login-form-panel,
  .login-brand-panel {
    padding: 1.15rem;
  }

  .field-error {
    font-size: 0.8rem;
    gap: 0.32rem;
  }

  .field-error-icon {
    width: 0.88rem;
    height: 0.88rem;
  }
}
</style>
