/**
 * Generic CRUD endpoint abstraction used by infrastructure layer.
 *
 * @template TResource
 * @class BaseEndpoint
 */
export class BaseEndpoint {
    /**
     * @param {import('./base-api.js').BaseApi} baseApi
     * @param {string} endpointPath - Relative path within the API (e.g., '/machines').
     */
    constructor(baseApi, endpointPath) {
        this.http = baseApi.http;
        this.endpointPath = endpointPath;
    }

    getAll(params)         { return this.http.get(this.endpointPath, { params }); }
    getById(id)            { return this.http.get(`${this.endpointPath}/${id}`); }
    create(resource)       { return this.http.post(this.endpointPath, resource); }
    update(id, resource)   { return this.http.put(`${this.endpointPath}/${id}`, resource); }
    patch(id, partial)     { return this.http.patch(`${this.endpointPath}/${id}`, partial); }
    delete(id)             { return this.http.delete(`${this.endpointPath}/${id}`); }
}
