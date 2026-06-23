import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const machinesEndpointPath = import.meta.env.VITE_MACHINES_ENDPOINT_PATH;

/**
 * Equipment bounded-context API (machines catalog / fleet).
 *
 * @class EquipmentApi
 * @extends BaseApi
 */
export class EquipmentApi extends BaseApi {
    #machinesEndpoint;

    constructor() {
        super();
        this.#machinesEndpoint = new BaseEndpoint(this, machinesEndpointPath);
    }

    /**
     * Returns the full catalog (no filter).
     * @param {Record<string, unknown>} [params]
     */
    getMachines(params) {
        return this.#machinesEndpoint.getAll(params);
    }

    /**
     * Fleet scoped to one owner via the nested REST route (not a query param),
     * matching the convention already used by RentalsApi.
     * @param {number|string} ownerId
     */
    getMachinesByOwnerId(ownerId) {
        return this.http.get(`/owners/${ownerId}/machines`);
    }

    /**
     * @param {number|string} id
     */
    getMachineById(id) {
        return this.#machinesEndpoint.getById(id);
    }

    /**
     * @param {Record<string, unknown>} resource
     */
    createMachine(resource) {
        return this.#machinesEndpoint.create(resource);
    }

    /**
     * @param {number|string} id
     * @param {Record<string, unknown>} partial
     */
    patchMachine(id, partial) {
        return this.#machinesEndpoint.patch(id, partial);
    }
}
