<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  points: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['point-select']);

const { t } = useI18n();
const hoveredIndex = ref(null);

const chart = computed(() => {
  const width = 640;
  const height = 240;
  const padding = { top: 20, right: 16, bottom: 32, left: 40 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const values = props.points.map(point => point.value);
  const maxValue = Math.max(...values, 1);
  const yMax = Math.ceil(maxValue / 100) * 100 || 400;
  const stepX = props.points.length > 1 ? innerWidth / (props.points.length - 1) : 0;

  const coordinates = props.points.map((point, index) => ({
    index,
    x: padding.left + stepX * index,
    y: padding.top + innerHeight - (point.value / yMax) * innerHeight,
    label: point.label,
    value: point.value
  }));

  const linePath = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = coordinates.length
      ? `${linePath} L ${coordinates[coordinates.length - 1].x} ${padding.top + innerHeight} L ${coordinates[0].x} ${padding.top + innerHeight} Z`
      : '';

  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const value = (yMax / 4) * index;
    return {
      value,
      y: padding.top + innerHeight - (value / yMax) * innerHeight
    };
  });

  return { width, height, coordinates, linePath, areaPath, yTicks, padding, innerHeight, yMax };
});

const hoveredPoint = computed(() => (
  hoveredIndex.value === null ? null : chart.value.coordinates[hoveredIndex.value]
));

function onPointHover(index) {
  hoveredIndex.value = index;
}

function onPointLeave() {
  hoveredIndex.value = null;
}

function onPointClick(index) {
  emit('point-select', props.points[index]);
}
</script>

<template>
  <div class="earnings-chart-wrap">
    <svg
        class="earnings-chart"
        :viewBox="`0 0 ${chart.width} ${chart.height}`"
        preserveAspectRatio="none"
        role="img"
        :aria-label="t('dashboard.chartAria')"
    >
      <defs>
        <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f97316" stop-opacity="0.55" />
          <stop offset="100%" stop-color="#f97316" stop-opacity="0" />
        </linearGradient>
      </defs>

      <g class="earnings-chart__grid">
        <line
            v-for="tick in chart.yTicks"
            :key="tick.value"
            :x1="chart.padding.left"
            :x2="chart.width - chart.padding.right"
            :y1="tick.y"
            :y2="tick.y"
        />
      </g>

      <line
          v-if="hoveredPoint"
          class="earnings-chart__cursor"
          :x1="hoveredPoint.x"
          :x2="hoveredPoint.x"
          :y1="chart.padding.top"
          :y2="chart.padding.top + chart.innerHeight"
      />

      <g class="earnings-chart__axis">
        <text
            v-for="tick in chart.yTicks"
            :key="`y-${tick.value}`"
            :x="chart.padding.left - 8"
            :y="tick.y + 4"
            text-anchor="end"
        >
          {{ tick.value }}
        </text>
        <text
            v-for="point in chart.coordinates"
            :key="`x-${point.label}-${point.index}`"
            :x="point.x"
            :y="chart.height - 10"
            text-anchor="middle"
        >
          {{ point.label }}
        </text>
      </g>

      <path v-if="chart.areaPath" :d="chart.areaPath" fill="url(#earningsGradient)" />
      <path v-if="chart.linePath" :d="chart.linePath" class="earnings-chart__line" />

      <g class="earnings-chart__points">
        <circle
            v-for="point in chart.coordinates"
            :key="`point-${point.index}`"
            :cx="point.x"
            :cy="point.y"
            r="16"
            class="earnings-chart__hit"
            @mouseenter="onPointHover(point.index)"
            @mouseleave="onPointLeave"
            @click="onPointClick(point.index)"
        />
        <circle
            v-for="point in chart.coordinates"
            :key="`dot-${point.index}`"
            :cx="point.x"
            :cy="point.y"
            r="hoveredIndex === point.index ? 5 : 3.5"
            class="earnings-chart__dot"
            :class="{ 'earnings-chart__dot--active': hoveredIndex === point.index }"
        />
      </g>
    </svg>

    <div
        v-if="hoveredPoint"
        class="earnings-chart__tooltip"
        :style="{ left: `${(hoveredPoint.x / chart.width) * 100}%` }"
    >
      <strong>{{ hoveredPoint.label }}</strong>
      <span>{{ t('dashboard.chartTooltip', { value: hoveredPoint.value }) }}</span>
    </div>
  </div>
</template>

<style scoped>
.earnings-chart-wrap {
  position: relative;
}

.earnings-chart {
  width: 100%;
  height: 240px;
  display: block;
}

.earnings-chart__grid line {
  stroke: rgba(148, 163, 184, 0.12);
  stroke-width: 1;
}

.earnings-chart__cursor {
  stroke: rgba(245, 166, 35, 0.45);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.earnings-chart__axis text {
  fill: #94a3b8;
  font-size: 11px;
  font-family: var(--mt-font-body);
}

.earnings-chart__line {
  fill: none;
  stroke: #fb7185;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.earnings-chart__hit {
  fill: transparent;
  cursor: pointer;
}

.earnings-chart__dot {
  fill: #fb7185;
  stroke: #0f172a;
  stroke-width: 2;
  pointer-events: none;
  transition: r 0.12s ease;
}

.earnings-chart__dot--active {
  fill: #f59e0b;
}

.earnings-chart__tooltip {
  position: absolute;
  top: 8px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(245, 166, 35, 0.25);
  color: #f8fafc;
  font-size: 12px;
  pointer-events: none;
  white-space: nowrap;
}

.earnings-chart__tooltip strong {
  color: var(--mt-color-primary);
}
</style>
