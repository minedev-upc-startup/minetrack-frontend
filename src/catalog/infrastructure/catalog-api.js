import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

// Usamos la variable de entorno que define la ruta /machines
const machinesEndpointPath = import.meta.env.VITE_MACHINES_ENDPOINT_PATH;

/**
 * Gateway de API para el contexto Catalog.
 * @class CatalogApi
 * @extends BaseApi
 */
export class CatalogApi extends BaseApi {
    #machinesEndpoint;

    constructor() {
        super();
        this.#machinesEndpoint = new BaseEndpoint(this, machinesEndpointPath);
    }

    getMachines()        { return this.#machinesEndpoint.getAll(); }
    getMachineById(id)   { return this.#machinesEndpoint.getById(id); }
    createMachine(r)     { return this.#machinesEndpoint.create(r); }
    updateMachine(r)     { return this.#machinesEndpoint.update(r.id, r); }
    deleteMachine(id)    { return this.#machinesEndpoint.delete(id); }
}