<script setup>
import { onMounted, toRefs } from 'vue';
import { useDashboardStore } from '../../application/dashboard.store.js';

const store = useDashboardStore();
const { metrics, loaded } = toRefs(store);

onMounted(() => { if (!loaded.value) store.fetchMetrics(); });
</script>

<template>
  <div class="dashboard-overview">
    <h1>Panel de Control</h1>
    <p class="text-secondary mb-4">Resumen de operaciones de MineTrack</p>

    <div class="grid">
      <div v-for="metric in metrics" :key="metric.id" class="col-12 md:col-6 lg:col-3">
        <pv-card>
          <template #content>
            <div class="flex justify-content-between align-items-center">
              <div>
                <span class="block text-500 font-medium mb-3">{{ metric.title }}</span>
                <div class="text-900 font-bold text-4xl">{{ metric.value }}</div>
              </div>
              <div class="flex align-items-center justify-content-center border-round" style="width: 2.5rem; height: 2.5rem">
                <i :class="[metric.icon, metric.colorClass, 'text-4xl']"></i>
              </div>
            </div>
          </template>
        </pv-card>
      </div>
    </div>
  </div>
</template>