import { defineStore } from 'pinia';
import { ref } from 'vue';
import { RentalsApi } from '../infrastructure/rentals-api.js';

const api = new RentalsApi();

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

    async function submitRequest(machineId, clientId, ownerId) {
        try {
            const newRequest = {
                machineId,
                clientId,
                ownerId,
                startDate: new Date().toISOString().split('T')[0], // Fecha de hoy
                endDate: "2026-12-31", // Fecha genérica de prueba
                status: "Pending",
                submittedAt: new Date().toISOString()
            };
            await api.createRequest(newRequest);
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
        const apiStatus = 'Approved';
        const success = await updateRequestStatus(id, apiStatus);
        if (!success) return false;
        const index = requests.value.findIndex(r => r.id === id);
        if (index !== -1) requests.value[index].status = 'Active';
        return true;
    }

    async function rejectRental(id) {
        return updateRequestStatus(id, 'Rejected');
    }

    return { requests, fetchRequests, submitRequest, updateRequestStatus, acceptRental, rejectRental };
});

export default useRentalsStore;