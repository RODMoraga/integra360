# Sistema de Design Tokens - Integra360

Guía integral para el uso consistente de tipografías, colores, espaciado, radios y sombras en toda la aplicación.

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Nomenclatura y Convenciones](#nomenclatura-y-convenciones)
3. [Tokens de Color](#tokens-de-color)
4. [Tokens de Tipografía](#tokens-de-tipografía)
5. [Tokens de Espaciado](#tokens-de-espaciado)
6. [Tokens de Radio](#tokens-de-radio)
7. [Tokens de Sombra](#tokens-de-sombra)
8. [Ejemplos por Componente](#ejemplos-por-componente)
9. [Patrones de Migración](#patrones-de-migración)
10. [Best Practices](#best-practices)

---

## Introducción

El sistema de tokens semánticos proporciona un vocabulario consistente para construir interfaces. Los tokens se definen en:

- **Tailwind**: `frontend/tailwind.config.js` (utilidades CSS)
- **CSS Global**: `frontend/src/assets/styles/main.css` (variables CSS)
- **Componentes**: `frontend/src/` (implementación)

### Por qué usar tokens

- ✅ Consistencia visual global
- ✅ Mantenibilidad: cambiar un token afecta toda la app
- ✅ Escalabilidad: agregar nuevos tokens sin duplicar valores
- ✅ Accesibilidad: garantizar contraste y espacios apropiados
- ✅ Colaboración: nomenclatura clara para todo el equipo

---

## Nomenclatura y Convenciones

### Reglas Generales

1. **Escala de 0-10**: De menor a mayor intensidad/tamaño
   - `50` = muy claro/pequeño
   - `500` = estándar/base
   - `950` = muy oscuro/grande

2. **Sufijos semánticos**:
   - `DEFAULT` = valor por defecto (cuando aplica)
   - `-muted` = versión más suave
   - `-subtle` = muy ligera
   - `-inverse` = contrario

3. **Prefijos semánticos**:
   - `primary` = acción principal
   - `secondary` = acción secundaria
   - `danger` = acciones destructivas
   - `warning` = alertas y precaución
   - `surface` = fondos y superficies
   - `on-surface` = texto y contenido sobre superficies

4. **Nombres en kebab-case** en Tailwind/CSS

### Ejemplo de Nomenclatura

```
--color-primary: #1736e8              /* Color base semántico */
--color-primary-50: #e8ebfd           /* Versión clara (no usado, pero existe) */
--color-on-surface-muted: #455eed     /* Texto muted sobre surface */
--spacing-card: 1.25rem               /* Padding estándar de tarjeta */
--radius-card: 1rem                   /* Radio de tarjeta */
--shadow-elevated: 0 16px 32px ...    /* Sombra para elementos elevados */
```

---

## Tokens de Color

### Colores Semánticos (uso recomendado)

```html
<!-- Tailwind Classes -->
<div class="bg-primary text-on-surface">Primary Background</div>
<button class="bg-secondary text-white">Secondary Button</button>
<div class="text-danger">Error Message</div>
<div class="bg-warning text-on-surface">Warning Box</div>

<!-- CSS Variables -->
<div style="background: var(--color-primary)">Via CSS Variable</div>
```

| Token | Uso |
|-------|-----|
| `primary` | Botones principales, enlaces activos, focos |
| `primary-600` | Hover en botones primarios |
| `primary-700` | Active en botones primarios |
| `secondary` | Botones secundarios, acentos alternativos |
| `danger` | Botones destructivos, errores críticos |
| `danger-600` | Hover en botones peligrosos |
| `warning` | Alertas, advertencias, precauciones |
| `surface` | Fondos base, tarjetas, paneles |
| `surface-elevated` | Modales, dropdowns, overlays |
| `surface-border` | Bordes, divisores |
| `on-surface` | Texto principal sobre fondos |
| `on-surface-muted` | Texto secundario, labels |
| `on-surface-subtle` | Texto terciario, hints |

### Paleta Corporativa Extendida

Disponible para casos especiales. Nombres: `ink-black`, `night-bordeaux`, `black-cherry`, `oxblood`, `brick-ember`, `red-ochre`, `cayenne-red`, `deep-saffron`, `orange`, `amber-flame`.

```html
<div class="text-ink-black-700">Texto oscuro corporativo</div>
<div class="bg-deep-saffron-500">Fondo saffron</div>
```

---

## Tokens de Tipografía

### Familias de Fuentes

Todas las fuentes utilizan **Quicksand** de Google Fonts (variable, wght 300-700).

```html
<!-- Via Tailwind (heredado del body) -->
<p class="font-sans">Texto regular (hereda Quicksand)</p>
<h1 class="font-display">Título (hereda Quicksand)</h1>

<!-- Clase explícita si necesitas reforzar -->
<p class="font-quicksand-variable">Refuerza Quicksand variable</p>
```

### Clases de Tipografía

```html
<!-- Tailwind text sizes -->
<p class="text-xs">Extra pequeño</p>
<p class="text-sm">Pequeño</p>
<p class="text-base">Base</p>
<p class="text-lg">Grande</p>
<p class="text-xl">Extra grande</p>
<p class="text-2xl">2x Grande</p>

<!-- Pesos -->
<p class="font-light">Light (300)</p>
<p class="font-normal">Normal (400)</p>
<p class="font-semibold">Semibold (600)</p>
<p class="font-bold">Bold (700)</p>
```

---

## Tokens de Espaciado

### Escala Semántica

```javascript
// En tailwind.config.js y CSS:
spacing: {
  "spacing-2xs": "0.25rem",   // 4px - micro gaps
  "spacing-xs": "0.5rem",     // 8px - small gaps
  "spacing-sm": "0.75rem",    // 12px - compact
  "spacing-md": "1rem",       // 16px - standard
  "spacing-lg": "1.5rem",     // 24px - comfortable
  "spacing-xl": "2rem",       // 32px - generous
  "spacing-2xl": "3rem",      // 48px - large sections
  section: "1.5rem",          // Entre secciones
  container: "1rem",          // Padding de contenedor
  card: "1.25rem"             // Padding de tarjeta
}
```

### Uso en Componentes

```html
<!-- Tailwind utilities -->
<div class="p-card">Tarjeta con padding semántico</div>
<div class="px-container py-section">Contenedor con espacios semánticos</div>

<!-- Gaps en grillas -->
<section class="grid gap-spacing-md md:grid-cols-3">
  <article>Card 1</article>
  <article>Card 2</article>
  <article>Card 3</article>
</section>

<!-- Márgenes -->
<h2 class="mt-spacing-lg mb-spacing-md">Encabezado con espacios</h2>
```

### Guía de Decisión

| Caso | Token | Ejemplo |
|------|-------|---------|
| Padding tarjeta | `p-card` | `<article class="p-card">` |
| Padding contenedor | `px-container py-section` | `<main class="px-container py-section">` |
| Gap grilla | `gap-spacing-md` | `<section class="grid gap-spacing-md">` |
| Margen título | `mt-spacing-lg mb-spacing-md` | `<h2 class="mt-spacing-lg">` |
| Espacios micro | `spacing-xs`, `spacing-2xs` | `<span class="ml-spacing-xs">` |

---

## Tokens de Radio

### Escala Semántica

```javascript
// En tailwind.config.js y CSS:
borderRadius: {
  "radius-sm": "0.5rem",      // 8px - inputs ligeros
  "radius-md": "0.75rem",     // 12px - estándar
  "radius-lg": "1rem",        // 16px - cómodo
  "radius-xl": "1.25rem",     // 20px - generoso
  "radius-2xl": "1.5rem",     // 24px - muy redondo
  card: "1rem",               // Tarjetas estándar
  panel: "1.25rem",           // Paneles/modales
  pill: "9999px"              // Botones pill, badges
}
```

### Uso en Componentes

```html
<!-- Tarjetas -->
<article class="rounded-card">Tarjeta estándar</article>

<!-- Paneles y modales -->
<div class="rounded-panel">Modal o panel grande</div>

<!-- Inputs -->
<input class="rounded-radius-md" />

<!-- Botones pill -->
<button class="rounded-pill px-spacing-lg">Seguir</button>

<!-- Variación compacta -->
<button class="rounded-radius-sm px-spacing-sm">Compacto</button>
```

---

## Tokens de Sombra

### Escala Semántica

```javascript
// En tailwind.config.js y CSS:
boxShadow: {
  soft: "0 4px 16px rgba(9, 22, 93, 0.08)",
  elevated: "0 16px 32px rgba(9, 22, 93, 0.14)",
  focus: "0 0 0 4px rgba(23, 54, 232, 0.24)",
  card: "0 8px 24px rgba(9, 22, 93, 0.10)",
  panel: "0 18px 36px rgba(9, 22, 93, 0.12)"
}
```

### Uso en Componentes

```html
<!-- Tarjetas de contenido -->
<article class="shadow-card">Tarjeta en flujo</article>

<!-- Elementos elevados (modales, dropdowns) -->
<div class="shadow-elevated">Modal o dropdown</div>

<!-- Sombra suave (más sutil) -->
<div class="shadow-soft">Elemento sutil</div>

<!-- Paneles grandes -->
<section class="shadow-panel">Panel/viewport</section>

<!-- Focus rings -->
<button class="shadow-focus">Botón en focus</button>
```

---

## Ejemplos por Componente

### Botón Principal

```vue
<template>
  <!-- ✅ CORRECTO: usar tokens semánticos -->
  <button class="bg-primary text-white rounded-radius-md px-spacing-lg py-spacing-md shadow-card hover:bg-primary-600">
    Enviar
  </button>
  
  <!-- ❌ INCORRECTO: valores hardcodeados -->
  <button class="bg-blue-600 text-white rounded-lg px-4 py-2 shadow-lg hover:bg-blue-700">
    Enviar
  </button>
</template>
```

### Tarjeta de Contenido

```vue
<template>
  <!-- ✅ CORRECTO: tokens semánticos -->
  <article class="glass-card rounded-card p-card shadow-card surface-panel">
    <h3 class="text-on-surface font-semibold mb-spacing-sm">Título</h3>
    <p class="text-on-surface-muted text-sm mb-spacing-lg">Descripción</p>
    <button class="btn btn-primary btn-sm">Acción</button>
  </article>
  
  <!-- ❌ INCORRECTO: sin tokens -->
  <article class="bg-white rounded-2xl p-6 shadow-xl">
    <h3 class="text-gray-900 font-semibold mb-4">Título</h3>
    <p class="text-gray-600 text-sm mb-6">Descripción</p>
    <button class="px-4 py-2 bg-blue-600 text-white rounded-lg">Acción</button>
  </article>
</template>
```

### Formulario

```vue
<template>
  <!-- ✅ CORRECTO: tokens para spacing y colores -->
  <form class="space-y-spacing-lg">
    <div>
      <label class="block text-on-surface text-sm font-semibold mb-spacing-sm">Email</label>
      <input 
        type="email" 
        class="form-control w-full rounded-radius-md px-spacing-md py-spacing-sm border border-surface-border focus:border-primary focus:shadow-focus"
      />
    </div>
    
    <div>
      <label class="block text-on-surface text-sm font-semibold mb-spacing-sm">Mensaje</label>
      <textarea 
        class="form-control w-full rounded-radius-md px-spacing-md py-spacing-md border border-surface-border focus:border-primary focus:shadow-focus"
      ></textarea>
    </div>
    
    <button class="bg-primary text-white rounded-radius-md px-spacing-lg py-spacing-md">
      Enviar
    </button>
  </form>
</template>
```

### Header/Navbar

```vue
<template>
  <!-- ✅ CORRECTO: tokens de spacing y colores -->
  <header class="border-b border-surface-border bg-surface-elevated/80 backdrop-blur">
    <div class="mx-auto max-w-6xl px-container py-spacing-sm flex items-center justify-between">
      <h1 class="font-display text-xl text-on-surface">Integra360</h1>
      <nav class="flex gap-spacing-md">
        <a href="#" class="text-on-surface-muted hover:text-on-surface">Inicio</a>
        <a href="#" class="text-on-surface-muted hover:text-on-surface">Dashboard</a>
      </nav>
      <button class="btn btn-outline-primary rounded-radius-md px-spacing-lg">
        Logout
      </button>
    </div>
  </header>
</template>
```

### Modal/Panel

```vue
<template>
  <!-- ✅ CORRECTO: shadow-panel, radius-panel, p-card -->
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div class="bg-surface-elevated rounded-panel p-card shadow-panel max-w-md">
      <h2 class="text-on-surface font-display text-xl mb-spacing-lg">Confirmar</h2>
      <p class="text-on-surface-muted mb-spacing-xl">¿Deseas continuar?</p>
      
      <div class="flex gap-spacing-md">
        <button class="flex-1 bg-surface-border text-on-surface rounded-radius-md px-spacing-lg py-spacing-md">
          Cancelar
        </button>
        <button class="flex-1 bg-primary text-white rounded-radius-md px-spacing-lg py-spacing-md">
          Confirmar
        </button>
      </div>
    </div>
  </div>
</template>
```

---

## Patrones de Migración

### Patrón 1: Reemplazar valores hardcodeados

**Antes:**
```html
<div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
  Contenido
</div>
```

**Después:**
```html
<div class="glass-card rounded-card p-card shadow-card surface-panel">
  Contenido
</div>
```

### Patrón 2: Convertir espacios mágicos a tokens

**Antes:**
```html
<div class="mt-4 mb-6 px-4">
  <h2 class="mb-3">Título</h2>
  <p>Párrafo</p>
</div>
```

**Después:**
```html
<div class="mt-spacing-md mb-spacing-lg px-container">
  <h2 class="mb-spacing-sm">Título</h2>
  <p>Párrafo</p>
</div>
```

### Patrón 3: Unificar colores en componentes

**Antes:**
```vue
<button class="bg-blue-600 hover:bg-blue-700 text-white">Botón 1</button>
<button class="bg-indigo-600 hover:bg-indigo-700 text-white">Botón 2</button>
```

**Después:**
```vue
<button class="bg-primary hover:bg-primary-600 text-white">Botón 1</button>
<button class="bg-primary hover:bg-primary-600 text-white">Botón 2</button>
```

---

## Best Practices

### ✅ Haz esto

1. **Usa tokens semánticos siempre**: `bg-primary` en lugar de `bg-blue-600`
2. **Agrupa espacios relacionados**: `mt-spacing-lg mb-spacing-md` en lugar de `mt-6 mb-4`
3. **Reutiliza patrones**: Si usas `shadow-card` en una tarjeta, reutilízalo en todas
4. **Documenta cambios**: Si necesitas un nuevo token, agrega una entrada aquí
5. **Revisa antes de hacer PR**: ¿Está usando tokens o valores hardcodeados?

### ❌ Evita esto

1. **Hardcodear valores**: `rounded-lg`, `p-6`, `shadow-xl`, `bg-gray-100`
2. **Mezclar tokens y valores**: `p-card mx-4` (inconsistente)
3. **Crear nuevos colores arbitrarios**: Usa la paleta corporativa existente
4. **Duplicar estilos**: Si parece una tarjeta, usa `glass-card` + `shadow-card`
5. **Ignorar el sistema**: Los tokens existen para tu comodidad

### Checklist para Nuevo Componente

- [ ] Colores: ¿Usa `primary`, `secondary`, `on-surface`?
- [ ] Espaciado: ¿Usa tokens `spacing-*`, `section`, `card`, `container`?
- [ ] Radio: ¿Usa `radius-*` o clases semánticas `rounded-card`?
- [ ] Sombra: ¿Usa `shadow-card`, `shadow-panel`, etc.?
- [ ] Tipografía: ¿Hereda de body (Quicksand) o refuerza con `font-quicksand-variable`?
- [ ] Accesibilidad: ¿Contraste suficiente con `on-surface`?
- [ ] Consistencia: ¿Parece igual al resto de la app?

---

## Referencias Rápidas

### Comando para Buscar Uso de Tokens

```bash
# Buscar componentes sin tokens (valores hardcodeados)
grep -r "p-\|m-\|rounded-\|shadow-\|text-gray\|bg-gray\|bg-white" src/ --include="*.vue" --include="*.js"

# Buscar usando tokens (ejemplo)
grep -r "p-card\|shadow-card\|bg-primary" src/ --include="*.vue"
```

### Exportar Variables CSS a JavaScript

```javascript
// src/utils/tokens.js
export const tokens = {
  color: {
    primary: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
    secondary: getComputedStyle(document.documentElement).getPropertyValue('--color-secondary').trim(),
  },
  spacing: {
    card: getComputedStyle(document.documentElement).getPropertyValue('--spacing-card').trim(),
  }
}
```

### Agregar Nuevo Token

1. Define en `tailwind.config.js` bajo `theme.extend.*`
2. Define en `main.css` como variable CSS en `:root`
3. Documenta en esta guía con ejemplo de uso
4. Actualiza los checklist si aplica

---

## Preguntas Frecuentes

**P: ¿Qué hago si no existe el token que necesito?**  
R: Abre un issue o PR sugiriendo el nuevo token. Describe el caso de uso, dónde se usaría y por qué no existe.

**P: ¿Puedo usar Tailwind clases directamente?**  
R: Evita al máximo. Si algo no está en tokens, probablemente debería estarlo.

**P: ¿Cómo cambio un token globalmente?**  
R: Edita `tailwind.config.js` y/o `main.css`. Los cambios se aplican automáticamente a toda la app.

**P: ¿Los tokens funcionan en dark mode?**  
R: Actualmente no hay dark mode. Cuando lo agreguemos, extensionamos los tokens con variantes `:dark`.

---

## Contacto y Feedback

Para dudas o mejoras a este sistema, contacta al equipo de UI/Design.

**Última actualización**: Abril 2026  
**Versión**: 1.0
