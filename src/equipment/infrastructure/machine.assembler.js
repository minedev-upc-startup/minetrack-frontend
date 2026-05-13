import { Machine } from '../domain/machine.entity.js';

/**
 * Maps machine resources from json-server into Machine entities.
 * @class MachineAssembler
 */
export class MachineAssembler {
    /**
     * @param {Object} resource
     * @returns {Machine}
     */
    static toEntityFromResource(resource) {
        return new Machine({
            id: resource.id,
            ownerId: resource.ownerId ?? null,
            name: resource.name ?? '',
            type: resource.type ?? '',
            brand: resource.brand ?? '',
            model: resource.model ?? '',
            year: resource.year ?? null,
            hourlyRate: resource.hourlyRate ?? 0,
            dailyMinimumHours: resource.dailyMinimumHours ?? null,
            status: resource.status ?? '',
            photos: Array.isArray(resource.photos) ? resource.photos : [],
            specs: resource.specs && typeof resource.specs === 'object' ? resource.specs : {},
            currentLocation: resource.currentLocation ?? null
        });
    }

    /**
     * @param {import('axios').AxiosResponse<{ data?: unknown[] } | unknown[]>} response
     * @returns {Machine[]}
     */
    static toEntitiesFromListResponse(response) {
        const raw = Array.isArray(response.data) ? response.data : response.data?.data;
        if (!Array.isArray(raw)) return [];
        return raw.map(r => MachineAssembler.toEntityFromResource(r));
    }
}
