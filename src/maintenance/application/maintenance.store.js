import { defineStore } from 'pinia';
import { ref } from 'vue';
import { maintenanceApi } from '../infrastructure/maintenance-api.js';

/**
 * Application service store for the Maintenance bounded context.
 * Holds IoT sensor alerts for the workshop monitoring panel.
 */
const useMaintenanceStore = defineStore('maintenance', () => {
    const alerts = ref([]);
    const alertsLoaded = ref(false);
    const errors = ref([]);

    async function fetchAlerts() {
        try {
            const response = await maintenanceApi.getAlerts();
            alerts.value = response.data ?? [];
            alertsLoaded.value = true;
        } catch (error) {
            errors.value.push(error);
        }
    }

    return {
        alerts,
        alertsLoaded,
        errors,
        fetchAlerts
    };
});

export default useMaintenanceStore;
