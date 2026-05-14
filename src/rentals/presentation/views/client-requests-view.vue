<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import useRentalsStore from '../../application/rentals.store.js';
import useIamStore from '../../../iam/application/iam.store.js';
import useEquipmentStore from '../../../equipment/application/equipment.store.js';

const { t } = useI18n();
const rentals = useRentalsStore();
const iam = useIamStore();
const equipment = useEquipmentStore();

onMounted(async () => {
  await equipment.fetchMachines();
  // Filtramos para ver solo las solicitudes de este cliente
  await rentals.fetchRequests({ clientId: iam.currentUserId });
});

function getMachineName(id) {
  return equipment.machines.find(m => m.id === id)?.name || 'Cargando...';
}

function getStatusSeverity(status) {
  switch (status) {
    case 'Approved': return 'success';
    case 'Pending': return 'warn';
    case 'Rejected': return 'danger';
    default: return 'info';
  }
}
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Mis Solicitudes de Alquiler</h1>
    <pv-data-table :value="rentals.requests" responsiveLayout="scroll" class="shadow-sm">
      <pv-column field="id" header="ID"></pv-column>
      <pv-column header="Maquinaria">
        <template #body="slotProps">
          {{ getMachineName(slotProps.data.machineId) }}
        </template>
      </pv-column>
      <pv-column field="startDate" header="Fecha Inicio"></pv-column>
      <pv-column header="Estado">
        <template #body="slotProps">
          <pv-tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
        </template>
      </pv-column>
    </pv-data-table>
  </div>
</template>