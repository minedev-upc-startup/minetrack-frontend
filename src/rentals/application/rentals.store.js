import { defineStore } from 'pinia';
import { ref } from 'vue';
import { RentalsApi } from '../infrastructure/rentals-api.js';
import { EquipmentApi } from '../../equipment/infrastructure/equipment-api.js';

const api = new RentalsApi();
const equipmentApi = new EquipmentApi();

const REQUESTS_STORAGE_KEY = 'minetrack-rental-requests';

const STATUS_RANK = {
    pending: 0,
    approved: 1,
    active: 2,
    rejected: 3,
    completed: 4
};

function normalizeStatus(status) {
    return String(status ?? '').trim().toLowerCase();
}

function statusRank(status) {
    return STATUS_RANK[normalizeStatus(status)] ?? -1;
}

function loadPersistedRequests() {
    try {
        const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function mergeRequestRecord(apiRecord, localRecord) {
    const preferredStatus = statusRank(localRecord.status) >= statusRank(apiRecord.status)
        ? localRecord.status
        : apiRecord.status;

    return {
        ...apiRecord,
        ...localRecord,
        status: preferredStatus
    };
}

function mergeRequestLists(apiList, localList) {
    const map = new Map();

    for (const item of localList) {
        if (item?.id != null) map.set(item.id, item);
    }

    for (const apiItem of apiList) {
        if (apiItem?.id == null) continue;
        const existing = map.get(apiItem.id);
        map.set(apiItem.id, existing ? mergeRequestRecord(apiItem, existing) : apiItem);
    }

    return Array.from(map.values()).sort((left, right) => (right.id ?? 0) - (left.id ?? 0));
}

const useRentalsStore = defineStore('rentals', () => {
    const requests = ref(loadPersistedRequests());

    function persistRequests() {
        localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests.value));
    }

    async function fetchRequests(filter = {}) {
        try {
            const response = await api.getRequests(filter);
            const apiData = response.data ?? [];
            const localSnapshot = requests.value.length ? requests.value : loadPersistedRequests();
            requests.value = mergeRequestLists(apiData, localSnapshot);
            persistRequests();
        } catch (error) {
            console.error(error);
            const persisted = loadPersistedRequests();
            if (persisted.length) requests.value = persisted;
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
            persistRequests();
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    async function updateRequestStatus(id, newStatus) {
        try {
            const resolvedAt = new Date().toISOString();
            await api.patchRequest(id, { status: newStatus, resolvedAt });
            const index = requests.value.findIndex(r => r.id === id);
            if (index !== -1) {
                requests.value[index] = {
                    ...requests.value[index],
                    status: newStatus,
                    resolvedAt
                };
            }
            persistRequests();
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
        if (index !== -1) {
            requests.value[index] = {
                ...requests.value[index],
                status: 'Active'
            };
        }
        persistRequests();
        return true;
    }

    async function rejectRental(id) {
        return updateRequestStatus(id, 'Rejected');
    }

    async function returnMachine(requestId) {
        const request = requests.value.find(item => item.id === requestId);
        if (!request) return false;

        try {
            const resolvedAt = new Date().toISOString();
            await api.patchRequest(requestId, {
                status: 'Completed',
                resolvedAt
            });
            await equipmentApi.patchMachine(request.machineId, { status: 'Available' });

            const index = requests.value.findIndex(item => item.id === requestId);
            if (index !== -1) {
                requests.value[index] = {
                    ...requests.value[index],
                    status: 'Completed',
                    resolvedAt
                };
            }
            persistRequests();
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    function isOperationalStatus(status) {
        const normalized = normalizeStatus(status);
        return normalized === 'active' || normalized === 'approved';
    }

    return {
        requests,
        fetchRequests,
        submitRequest,
        updateRequestStatus,
        acceptRental,
        rejectRental,
        returnMachine,
        isOperationalStatus,
        persistRequests
    };
});

export default useRentalsStore;
