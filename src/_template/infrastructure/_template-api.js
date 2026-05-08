import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

// Replace with the env var defined in .env.development.
const examplesEndpointPath = import.meta.env.VITE_EXAMPLES_ENDPOINT_PATH ?? '/examples';

/**
 * Replace with the real API class for your bounded context (CatalogApi, RentalsApi, ...).
 *
 * @class TemplateApi
 * @extends BaseApi
 */
export class TemplateApi extends BaseApi {
    #examplesEndpoint;

    constructor() {
        super();
        this.#examplesEndpoint = new BaseEndpoint(this, examplesEndpointPath);
    }

    getExamples()        { return this.#examplesEndpoint.getAll(); }
    getExampleById(id)   { return this.#examplesEndpoint.getById(id); }
    createExample(r)     { return this.#examplesEndpoint.create(r); }
    updateExample(r)     { return this.#examplesEndpoint.update(r.id, r); }
    deleteExample(id)    { return this.#examplesEndpoint.delete(id); }
}
