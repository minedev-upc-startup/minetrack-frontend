<script setup>
import { onMounted, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useCatalogStore } from '../../application/catalog.store.js';

const { t } = useI18n();
const router = useRouter();
const store = useCatalogStore();
// Conectamos las variables de nuestro store a esta pantalla
const { machines, machinesLoaded, errors } = toRefs(store);
const { fetchMachines, deleteMachine } = store;

// Cuando la pantalla cargue, pedimos las máquinas a la base de datos
onMounted(() => { if (!machinesLoaded.value) fetchMachines(); });
</script>

<template>
  <div>
    <h1>Catálogo de Máquinas</h1>
    <pv-button label="Nueva Máquina" icon="pi pi-plus" @click="router.push({ name: 'catalog-new' })" />

    <pv-data-table :value="machines" :loading="!machinesLoaded" striped-rows class="mt-3">
      <pv-column field="id" header="ID" sortable />
      <pv-column field="name" header="Nombre" sortable />
      <pv-column field="brand" header="Marca" sortable />
      <pv-column field="model" header="Modelo" sortable />
      <pv-column field="status" header="Estado" sortable />

      <pv-column field="hourlyRate" header="Tarifa/Hora" sortable>
        <template #body="slotProps">
          S/ {{ slotProps.data.hourlyRate }}
        </template>
      </pv-column>

      <pv-column header="Acciones">
        <template #body="slotProps">
          <pv-button icon="pi pi-pencil" text rounded @click="router.push({ name: 'catalog-edit', params: { id: slotProps.data.id } })" />
          <pv-button icon="pi pi-trash" text rounded severity="danger" @click="deleteMachine(slotProps.data)" />
        </template>
      </pv-column>
    </pv-data-table>

    <div v-if="errors.length" class="error">{{ errors.map(e => e.message).join(', ') }}</div>
  </div>
</template>