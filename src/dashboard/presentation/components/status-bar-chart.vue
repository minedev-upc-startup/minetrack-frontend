<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  points: {
    type: Array,
    default: () => []
  },
  activeFilter: {
    type: String,
    default: 'all'
  }
});

const emit = defineEmits(['filter']);

const { t } = useI18n();
const hoveredIndex = ref(null);

const chart = computed(() => {
  const width = 640;
  const height = 220;
  const padding = { top: 20, right: 16, bottom: 40, left: 24 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...props.points.map(point => point.value), 1);
  const barGap = 18;
  const barWidth = props.points.length
      ? (innerWidth - barGap * (props.points.length - 1)) / props.points.length
      : 0;

  const bars = props.points.map((point, index) => {
    const heightValue = (point.value / maxValue) * innerHeight;
    const x = padding.left + index * (barWidth + barGap);
    const y = padding.top + innerHeight - heightValue;
    return {
      index,
      x,
      y,
      width: barWidth,
      height: heightValue,
      label: point.label,
      value: point.value,
      color: point.color,
      filterKey: point.filterKey
    };
  });

  return { width, height, bars, padding, innerHeight, maxValue };
});

function onBarClick(bar) {
  emit('filter', bar.filterKey);
}

function isActive(bar) {
  return props.activeFilter === 'all' || props.activeFilter === bar.filterKey;
}
</script>

<template>
  <div class="status-chart-wrap">
    <svg
        class="status-chart"
        :viewBox="`0 0 ${chart.width} ${chart.height}`"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        :aria-label="t('dashboard.statusChartAria')"
    >
      <g class="status-chart__bars">
        <g
            v-for="bar in chart.bars"
            :key="bar.filterKey"
            class="status-chart__bar-group"
            :class="{
              'status-chart__bar-group--hover': hoveredIndex === bar.index,
              'status-chart__bar-group--active': isActive(bar),
              'status-chart__bar-group--dimmed': activeFilter !== 'all' && !isActive(bar)
            }"
            @mouseenter="hoveredIndex = bar.index"
            @mouseleave="hoveredIndex = null"
            @click="onBarClick(bar)"
        >
          <rect
              :x="bar.x"
              :y="bar.y"
              :width="bar.width"
              :height="bar.height"
              :fill="bar.color"
              rx="8"
              class="status-chart__bar"
          />
          <text :x="bar.x + bar.width / 2" :y="bar.y - 8" text-anchor="middle" class="status-chart__value">
            {{ bar.value }}
          </text>
          <text
              :x="bar.x + bar.width / 2"
              :y="chart.height - 12"
              text-anchor="middle"
              class="status-chart__label"
          >
            {{ t(bar.label) }}
          </text>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.status-chart-wrap {
  width: 100%;
}

.status-chart {
  width: 100%;
  height: 220px;
  display: block;
}

.status-chart__bar-group {
  cursor: pointer;
}

.status-chart__bar {
  opacity: 0.82;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.status-chart__bar-group--hover .status-chart__bar,
.status-chart__bar-group--active .status-chart__bar {
  opacity: 1;
}

.status-chart__bar-group--dimmed .status-chart__bar {
  opacity: 0.28;
}

.status-chart__value {
  fill: #f8fafc;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--mt-font-body);
}

.status-chart__label {
  fill: #94a3b8;
  font-size: 11px;
  font-family: var(--mt-font-body);
}
</style>
