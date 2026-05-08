import { Example } from '../domain/model/example.entity.js';

/**
 * Maps API resources into Example entities.
 * @class ExampleAssembler
 */
export class ExampleAssembler {
    /** @param {Object} resource @returns {Example} */
    static toEntityFromResource(resource) {
        return new Example({ ...resource });
    }

    /** @param {import('axios').AxiosResponse} response @returns {Example[]} */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} ${response.statusText}`);
            return [];
        }
        const list = Array.isArray(response.data) ? response.data : (response.data?.examples ?? []);
        return list.map(r => this.toEntityFromResource(r));
    }
}
