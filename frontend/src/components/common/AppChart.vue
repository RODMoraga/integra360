<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import { Chart } from "chart.js/auto";

const props = defineProps({
  type: {
    type: String,
    default: "line"
  },
  labels: {
    type: Array,
    default: () => []
  },
  datasets: {
    type: Array,
    default: () => []
  },
  options: {
    type: Object,
    default: () => ({})
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
    type: props.type,
    data: {
      labels: props.labels,
      datasets: props.datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#050b2e",
            usePointStyle: true,
            pointStyle: "circle",
            font: {
              family: "Quicksand"
            }
          }
        },
        tooltip: {
          backgroundColor: "rgba(5, 11, 46, 0.92)",
          titleFont: {
            family: "Quicksand",
            weight: "700"
          },
          bodyFont: {
            family: "Quicksand"
          },
          padding: 12,
          cornerRadius: 12
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: "#455eed",
            font: {
              family: "Quicksand"
            }
          }
        },
        y: {
          grid: {
            color: "rgba(209, 215, 250, 0.65)"
          },
          ticks: {
            color: "#455eed",
            font: {
              family: "Quicksand"
            }
          },
          beginAtZero: true
        }
      },
      ...props.options
    }
  });
}

onMounted(renderChart);

watch(
  () => [props.type, props.labels, props.datasets, props.options],
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
