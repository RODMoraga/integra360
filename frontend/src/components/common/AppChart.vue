<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import { Chart } from "chart.js/auto";

const props = defineProps({
  labels: {
    type: Array,
    default: () => []
  },
  values: {
    type: Array,
    default: () => []
  }
});

const canvasRef = ref(null);
let chartInstance;

function renderChart() {
  if (!canvasRef.value) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(canvasRef.value, {
    type: "line",
    data: {
      labels: props.labels,
      datasets: [
        {
          label: "Revenue",
          data: props.values,
          borderColor: "#1f6feb",
          backgroundColor: "rgba(31,111,235,0.12)",
          fill: true,
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

onMounted(renderChart);

watch(
  () => [props.labels, props.values],
  () => renderChart(),
  { deep: true }
);

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>

<template>
  <div class="h-80 w-full">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>
