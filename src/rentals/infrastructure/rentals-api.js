import { BaseApi } from '../../shared/infrastructure/base-api.js';

const RENTALS_PATH = import.meta.env.VITE_RENTALS_ENDPOINT_PATH;

export class RentalsApi extends BaseApi {
    constructor() {
        super();
    }

    getAllRequests() {
        return this.http.get(RENTALS_PATH);
    }

    getRequestsByClient(clientId) {
        return this.http.get(`/clients/${clientId}/rentals`);
    }

    getRequestsByOwner(ownerId) {
        return this.http.get(`/owners/${ownerId}/rentals`);
    }

    createRequest(resource) {
        return this.http.post(RENTALS_PATH, resource);
    }

    approveRequest(id) {
        return this.http.patch(`${RENTALS_PATH}/${id}/approve`);
    }

    rejectRequest(id, rejectionReason = '') {
        return this.http.patch(`${RENTALS_PATH}/${id}/reject`, { rejectionReason });
    }
}