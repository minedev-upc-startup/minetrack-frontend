import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

export class RentalsApi extends BaseApi {
    #requestsEndpoint;

    constructor() {
        super();

        this.#requestsEndpoint = new BaseEndpoint(this, '/rentalRequests');
    }


    getRequests(params) {
        return this.#requestsEndpoint.getAll(params);
    }




    createRequest(resource) {
        return this.#requestsEndpoint.create(resource);
    }


    patchRequest(id, partial) {
        return this.#requestsEndpoint.patch(id, partial);
    }
}