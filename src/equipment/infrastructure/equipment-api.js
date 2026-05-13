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
     * @param {{ ownerId?: number }} [params]
     */
    getMachines(params) {
        return this.#machinesEndpoint.getAll(params);
    }

    /**
     * @param {number|string} id
     */
    getMachineById(id) {
        return this.#machinesEndpoint.getById(id);
    }

    /**
     * @param {number|string} id
     * @param {Record<string, unknown>} partial
     */
    patchMachine(id, partial) {
        return this.#machinesEndpoint.patch(id, partial);
    }
}
