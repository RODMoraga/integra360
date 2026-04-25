<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import TomSelect from "tom-select";
import "tom-select/dist/css/tom-select.bootstrap5.css";

const props = defineProps({
  modelValue: {
    type: String,
    default: ""
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: "Seleccionar"
  },
  label: {
    type: String,
    default: ""
  },
  id: {
    type: String,
    required: true
  }
});

const emit = defineEmits(["update:modelValue"]);

const selectRef = ref(null);
let tom = null;

function initTomSelect() {
  if (!selectRef.value || tom) return;

  tom = new TomSelect(selectRef.value, {
    create: false,
    maxItems: 1,
    allowEmptyOption: true,
    closeAfterSelect: true,
    placeholder: props.placeholder,
    render: {
      no_results: () => '<div class="no-results">Sin resultados</div>'
    },
    onChange(value) {
      emit("update:modelValue", value);
    }
  });
}

function syncOptions() {
  if (!tom) return;

  const mapped = props.options.map((option) => ({
    value: option.value,
    text: option.label
  }));

  tom.clearOptions();
  tom.addOptions(mapped);
  tom.refreshOptions(false);

  if (props.modelValue) {
    tom.setValue(props.modelValue, true);
  } else {
    tom.clear(true);
  }
}

onMounted(async () => {
  await nextTick();
  initTomSelect();
  syncOptions();
});

watch(
  () => props.options,
  () => {
    syncOptions();
  },
  { deep: true }
);

watch(
  () => props.modelValue,
  (value) => {
    if (!tom) return;
    if (value) {
      tom.setValue(value, true);
    } else {
      tom.clear(true);
    }
  }
);

onBeforeUnmount(() => {
  if (tom) {
    tom.destroy();
    tom = null;
  }
});
</script>

<template>
  <div class="advanced-select">
    <label v-if="label" class="mb-1 block text-sm font-semibold text-on-surface">{{ label }}</label>
    <select :id="id" ref="selectRef" class="form-select">
      <option value="">{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.advanced-select :deep(.ts-wrapper.single .ts-control) {
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-md);
  min-height: 42px;
  box-shadow: none;
  font-size: 0.95rem;
}

.advanced-select :deep(.ts-wrapper.focus .ts-control) {
  border-color: color-mix(in srgb, var(--color-primary) 55%, white);
  box-shadow: 0 0 0 0.25rem color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.advanced-select :deep(.ts-dropdown) {
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft);
}

.advanced-select :deep(.no-results) {
  padding: var(--spacing-sm);
  color: var(--color-on-surface-muted);
}
</style>
