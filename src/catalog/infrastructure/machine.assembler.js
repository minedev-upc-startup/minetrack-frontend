import { Machine } from '../domain/model/machine.entity.js';

/**
 * Mapea recursos de la API a entidades Machine.
 * @class MachineAssembler
 */
export class MachineAssembler {
    static toEntityFromResource(resource) {
        return new Machine({ ...resource });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} ${response.statusText}`);
            return [];
        }
        // Si la data es un array directo, lo usamos.
        const list = Array.isArray(response.data) ? response.data : (response.data?.machines ?? []);
        return list.map(r => this.toEntityFromResource(r));
    }
}