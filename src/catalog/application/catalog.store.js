import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { CatalogApi } from '../infrastructure/catalog-api.js';
import { MachineAssembler } from '../infrastructure/machine.assembler.js';

const api = new CatalogApi();

/**
 * Application service store para el contexto Catalog (Máquinas).
 */
export const useCatalogStore = defineStore('catalog', () => {
    const machines       = ref([]);
    const machinesLoaded = ref(false);
    const errors         = ref([]);

    const machinesCount = computed(() => machines.value.length);

    async function fetchMachines() {
        try {
            const response = await api.getMachines();
            machines.value = MachineAssembler.toEntitiesFromResponse(response);
            machinesLoaded.value = true;
        } catch (e) {
            errors.value.push(e);
        }
    }

    async function addMachine(machine) {
        try {
            const response = await api.createMachine(machine);
            machines.value.push(MachineAssembler.toEntityFromResource(response.data));
        } catch (e) {
            errors.value.push(e);
        }
    }

    async function updateMachine(machine) {
        try {
            const response = await api.updateMachine(machine);
            const updated = MachineAssembler.toEntityFromResource(response.data);
            const idx = machines.value.findIndex(x => x.id === updated.id);
            if (idx !== -1) machines.value[idx] = updated;
        } catch (e) {
            errors.value.push(e);
        }
    }

    async function deleteMachine(machine) {
        try {
            await api.deleteMachine(machine.id);
            const idx = machines.value.findIndex(x => x.id === machine.id);
            if (idx !== -1) machines.value.splice(idx, 1);
        } catch (e) {
            errors.value.push(e);
        }
    }

    return { machines, machinesLoaded, machinesCount, errors,
        fetchMachines, addMachine, updateMachine, deleteMachine };
});