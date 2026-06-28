import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const BASE_URL = import.meta.env.VITE_MINETRACK_API_URL;

export class IamApi extends BaseApi {
    #signInEndpoint;
    #signUpEndpoint;

    constructor() {
        super();
        this.#signInEndpoint = new BaseEndpoint(this, `${BASE_URL}/authentication/sign-in`);
        this.#signUpEndpoint = new BaseEndpoint(this, `${BASE_URL}/authentication/sign-up`);
    }

    signIn(command) {
        return this.#signInEndpoint.create(command);
    }

    signUp(command) {
        return this.#signUpEndpoint.create(command);
    }
}