import { defineStore } from 'pinia';
import { ref } from 'vue';
import { RentalsApi } from '../infrastructure/rentals-api.js';
import { EquipmentApi } from '../../equipment/infrastructure/equipment-api.js';

const api = new RentalsApi();
const equipmentApi = new EquipmentApi();

const useRentalsStore = defineStore('rentals', () => {
    const requests = ref([]);

    async function fetchRequests(filter = {}) {
        try {
            const response = await api.getRequests(filter);
            requests.value = response.data;
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * @param {number} machineId
     * @param {number} clientId
     * @param {number} ownerId
     * @param {{ startDate?: string, endDate?: string, estimatedTotalCost?: number }} [options]
     */
    async function submitRequest(machineId, clientId, ownerId, options = {}) {
        try {
            const newRequest = {
                machineId,
                clientId,
                ownerId,
                startDate: options.startDate ?? new Date().toISOString().split('T')[0],
                endDate: options.endDate ?? new Date().toISOString().split('T')[0],
                estimatedTotalCost: options.estimatedTotalCost ?? null,
                status: 'Pending',
                submittedAt: new Date().toISOString()
            };
            const response = await api.createRequest(newRequest);
            requests.value.push(response.data);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    async function updateRequestStatus(id, newStatus) {
        try {
            await api.patchRequest(id, { status: newStatus, resolvedAt: new Date().toISOString() });
            const index = requests.value.findIndex(r => r.id === id);
            if (index !== -1) requests.value[index].status = newStatus;
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    async function acceptRental(id) {
        const success = await updateRequestStatus(id, 'Approved');
        if (!success) return false;
        const index = requests.value.findIndex(r => r.id === id);
        if (index !== -1) requests.value[index].status = 'Active';
        return true;
    }

    async function rejectRental(id) {
        return updateRequestStatus(id, 'Rejected');
    }

    async function returnMachine(requestId) {
        const request = requests.value.find(item => item.id === requestId);
        if (!request) return false;

        try {
            await api.patchRequest(requestId, {
                status: 'Completed',
                resolvedAt: new Date().toISOString()
            });
            await equipmentApi.patchMachine(request.machineId, { status: 'Available' });

            const index = requests.value.findIndex(item => item.id === requestId);
            if (index !== -1) requests.value[index].status = 'Completed';
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    return {
        requests,
        fetchRequests,
        submitRequest,
        updateRequestStatus,
        acceptRental,
        rejectRental,
        returnMachine
    };
});

export default useRentalsStore;
