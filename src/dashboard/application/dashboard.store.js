import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DashboardApi } from '../infrastructure/dashboard-api.js';
import { DashboardMetricAssembler } from '../infrastructure/dashboard-metric.assembler.js';

const api = new DashboardApi();

export const useDashboardStore = defineStore('dashboard', () => {
    const metrics = ref([]);
    const loaded = ref(false);

    async function fetchMetrics() {
        try {
            const response = await api.getMetrics();
            metrics.value = DashboardMetricAssembler.toEntitiesFromResponse(response);
            loaded.value = true;
        } catch (e) {
            console.error(e);
        }
    }
    return { metrics, loaded, fetchMetrics };
});