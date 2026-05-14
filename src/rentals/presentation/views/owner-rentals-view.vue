<script setup>
import { onMounted } from 'vue';
import useRentalsStore from '../../application/rentals.store.js';
import useIamStore from '../../../iam/application/iam.store.js';
import { useToast } from 'primevue/usetoast';

const rentals = useRentalsStore();
const iam = useIamStore();
const toast = useToast();

onMounted(() => rentals.fetchRequests({ ownerId: iam.currentUserId }));

async function handleAction(id, status) {
  const success = await rentals.updateRequestStatus(id, status);
  if (success) {
    toast.add({ severity: 'info', summary: 'Actualizado', detail: `Solicitud ${status}`, life: 3000 });
  }
}
</script>

<template>
  <div class="p-4">
    <pv-toast />
    <h1 class="text-2xl font-bold mb-4">Gestión de Alquileres Recibidos</h1>
    <pv-data-table :value="rentals.requests">
      <pv-column field="machineId" header="Máquina ID"></pv-column>
      <pv-column field="status" header="Estado"></pv-column>
      <pv-column header="Acciones">
        <template #body="slotProps">
          <div v-if="slotProps.data.status === 'Pending'" class="flex gap-2">
            <pv-button icon="pi pi-check" class="p-button-success p-button-sm" @click="handleAction(slotProps.data.id, 'Approved')" />
            <pv-button icon="pi pi-times" class="p-button-danger p-button-sm" @click="handleAction(slotProps.data.id, 'Rejected')" />
          </div>
          <span v-else>Procesada</span>
        </template>
      </pv-column>
    </pv-data-table>
  </div>
</template>