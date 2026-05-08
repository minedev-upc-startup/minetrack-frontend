import axios from 'axios';

const platformApi = import.meta.env.VITE_MINETRACK_API_URL;

/**
 * Shared infrastructure HTTP client factory.
 * Every bounded-context API (CatalogApi, RentalsApi, ...) extends this class
 * to inherit a configured Axios instance pointing at the platform API.
 *
 * @class BaseApi
 */
export class BaseApi {
    #http;

    constructor() {
        this.#http = axios.create({
            baseURL: platformApi,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Attach Authorization header when a JWT exists in localStorage.
        // The IAM context writes the token on successful sign-in.
        this.#http.interceptors.request.use(config => {
            const token = localStorage.getItem('token');
            if (token) config.headers.Authorization = `Bearer ${token}`;
            return config;
        });
    }

    /** @returns {import('axios').AxiosInstance} Axios client */
    get http() { return this.#http; }
}
