import { defineStore } from 'pinia';
import { ref } from 'vue';
import { EquipmentApi } from '../infrastructure/equipment-api.js';
import { MachineAssembler } from '../infrastructure/machine.assembler.js';

const equipmentApi = new EquipmentApi();

/**
 * Application store for the Equipment bounded context.
 */
const useEquipmentStore = defineStore('equipment', () => {
    const machines = ref([]);
    const machinesLoaded = ref(false);
    const errors = ref([]);

    /**
     * Load machines. Pass ownerId to scope the fleet to one owner — this hits
     * the nested REST route (/owners/{id}/machines), not a query param.
     * @param {{ ownerId?: number }} [filter]
     */
    async function fetchMachines(filter = {}) {
        errors.value = [];
        try {
            const response = filter.ownerId != null
                ? await equipmentApi.getMachinesByOwnerId(filter.ownerId)
                : await equipmentApi.getMachines();
            machines.value = MachineAssembler.toEntitiesFromListResponse(response);
            machinesLoaded.value = true;
        } catch (e) {
            errors.value.push(e);
        }
    }

    /**
     * @param {import('../domain/machine.entity.js').Machine} machine
     * @param {Record<string, unknown>} partial
     */
    async function patchMachine(machine, partial) {
        errors.value = [];
        try {
            const response = await equipmentApi.patchMachine(machine.id, partial);
            const updated = MachineAssembler.toEntityFromResource(response.data);
            const idx = machines.value.findIndex(m => m.id === updated.id);
            if (idx !== -1) machines.value[idx] = updated;
            return updated;
        } catch (e) {
            errors.value.push(e);
            return null;
        }
    }


    async function createMachine(resource) {
        errors.value = [];
        try {
            const response = await equipmentApi.createMachine(resource);
            const created = MachineAssembler.toEntityFromResource(response.data);
            machines.value.push(created);
            return created;
        } catch (e) {
            errors.value.push(e);
            throw e;
        }
    }
    function reset() {
        machines.value = [];
        machinesLoaded.value = false;
        errors.value = [];
    }

    return {
        machines,
        machinesLoaded,
        errors,
        fetchMachines,
        createMachine,
        patchMachine,
        reset
    };
});

export default useEquipmentStore;
