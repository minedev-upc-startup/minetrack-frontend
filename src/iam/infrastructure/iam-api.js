import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const usersEndpointPath = import.meta.env.VITE_USERS_ENDPOINT_PATH;

/**
 * IAM bounded-context API gateway.
 *
 * NOTE on the fake backend:
 *   The C# backend will eventually expose dedicated /authentication/sign-in
 *   and /authentication/sign-up endpoints with proper JWT issuance. While the
 *   fake API is just json-server, we simulate those use cases by reading and
 *   writing the /users collection directly. The store synthesizes a fake JWT
 *   so the rest of the app behaves as if a real backend issued it.
 *
 *   When the C# backend ships, only this class needs to change.
 *
 * @class IamApi
 * @extends BaseApi
 */
export class IamApi extends BaseApi {
    #usersEndpoint;

    constructor() {
        super();
        this.#usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
    }

    /**
     * Find users by email (json-server filter syntax: ?email=value).
     * @param {string} email
     */
    findByEmail(email) {
        return this.#usersEndpoint.getAll({ email });
    }

    /**
     * Persist a new user resource.
     * @param {Object} resource
     */
    createUser(resource) {
        return this.#usersEndpoint.create(resource);
    }
}
