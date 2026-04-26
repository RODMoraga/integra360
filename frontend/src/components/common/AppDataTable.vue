<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

let dataTableConstructor = null;

const props = defineProps({
  columns: {
    type: Array,
    default: () => []
  },
  rows: {
    type: Array,
    default: () => []
  },
  options: {
    type: Object,
    default: () => ({})
  },
  pageLength: {
    type: Number,
    default: 5
  }
});

const tableRef = ref(null);
let instance = null;

async function ensureDataTableRuntime() {
  if (dataTableConstructor) {
    return;
  }

  const [{ default: DataTable }] = await Promise.all([
    import("datatables.net-dt"),
    import("datatables.net-dt/css/dataTables.dataTables.css")
  ]);

  dataTableConstructor = DataTable;
}

function destroyTable() {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}

async function renderTable() {
  try {
    await nextTick();
    await ensureDataTableRuntime();

    if (!tableRef.value) {
      return;
    }

    destroyTable();

    instance = new dataTableConstructor(tableRef.value, {
      data: props.rows,
      columns: props.columns,
      autoWidth: false,
      pageLength: props.pageLength,
      order: [],
      dom: "<'datatable-head'f>rt<'datatable-foot'lip>",
      language: {
        search: "Buscar",
        searchPlaceholder: "Filtrar registros",
        lengthMenu: "Mostrar _MENU_",
        info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
        infoEmpty: "Sin registros disponibles",
        zeroRecords: "No se encontraron coincidencias",
        emptyTable: "No hay informacion disponible",
        paginate: {
          previous: "Anterior",
          next: "Siguiente"
        }
      },
      ...props.options
    });
  } catch (error) {
    console.error("No fue posible inicializar DataTables", error);
  }
}

onMounted(renderTable);

watch(
  () => props.rows,
  () => {
    void renderTable();
  },
  { deep: true }
);

watch(
  () => props.columns,
  () => {
    void renderTable();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  destroyTable();
});
</script>

<template>
  <div class="datatable-shell overflow-hidden rounded-panel border border-surface-border/80 bg-white/95 shadow-soft">
    <div class="table-scroll overflow-x-auto">
      <table ref="tableRef" class="dashboard-datatable stripe hover order-column compact w-full">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.title">{{ column.title }}</th>
          </tr>
        </thead>
      </table>
    </div>
  </div>
</template>
