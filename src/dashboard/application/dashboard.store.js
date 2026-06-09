import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DashboardApi } from '../infrastructure/dashboard-api.js';
import { DashboardOverviewAssembler } from '../infrastructure/dashboard-overview.assembler.js';

const api = new DashboardApi();

function applyOverview(overview, state) {
    state.metrics.value = overview.metrics;
    state.tableRows.value = overview.tableRows;
    state.earningsSeries.value = overview.earningsSeries;
    state.statusSeries.value = overview.statusSeries;
    state.chartTotal.value = overview.chartTotal;
    state.chartGrowth.value = overview.chartGrowth;
    state.fleetOperational.value = overview.fleetOperational;
    state.tableMode.value = overview.tableMode;
    state.loaded.value = true;
}

export const useDashboardStore = defineStore('dashboard', () => {
    const metrics = ref([]);
    const tableRows = ref([]);
    const earningsSeries = ref([]);
    const statusSeries = ref([]);
    const chartTotal = ref('0k');
    const chartGrowth = ref(null);
    const fleetOperational = ref(true);
    const tableMode = ref('owner');
    const loaded = ref(false);
    const loading = ref(false);
    const viewMode = ref('owner');

    const state = {
        metrics,
        tableRows,
        earningsSeries,
        statusSeries,
        chartTotal,
        chartGrowth,
        fleetOperational,
        tableMode,
        loaded
    };

    async function fetchOwnerDashboard(ownerId) {
        loading.value = true;
        viewMode.value = 'owner';
        try {
            const response = await api.getOwnerOverview(ownerId);
            if (response.status !== 200 || !response.data) {
                resetState();
                return;
            }
            applyOverview(DashboardOverviewAssembler.toOwnerOverview(response.data), state);
        } catch (error) {
            console.error(error);
            resetState();
        } finally {
            loading.value = false;
        }
    }

    async function fetchClientDashboard(clientId) {
        loading.value = true;
        viewMode.value = 'client';
        try {
            const response = await api.getClientOverview(clientId);
            if (response.status !== 200 || !response.data) {
                resetState();
                return;
            }
            applyOverview(DashboardOverviewAssembler.toClientOverview(response.data), state);
        } catch (error) {
            console.error(error);
            resetState();
        } finally {
            loading.value = false;
        }
    }

    async function fetchIntermediaryDashboard() {
        loading.value = true;
        viewMode.value = 'intermediary';
        try {
            const response = await api.getIntermediaryOverview();
            if (response.status !== 200 || !response.data) {
                resetState();
                return;
            }
            applyOverview(DashboardOverviewAssembler.toIntermediaryOverview(response.data), state);
        } catch (error) {
            console.error(error);
            resetState();
        } finally {
            loading.value = false;
        }
    }

    function resetState() {
        metrics.value = [];
        tableRows.value = [];
        earningsSeries.value = [];
        statusSeries.value = [];
        chartTotal.value = '0k';
        chartGrowth.value = null;
        fleetOperational.value = true;
        tableMode.value = 'owner';
        loaded.value = false;
    }

    return {
        metrics,
        tableRows,
        earningsSeries,
        statusSeries,
        chartTotal,
        chartGrowth,
        fleetOperational,
        tableMode,
        loaded,
        loading,
        viewMode,
        fetchOwnerDashboard,
        fetchClientDashboard,
        fetchIntermediaryDashboard,
        resetState
    };
});
