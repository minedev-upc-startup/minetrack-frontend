<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCatalogStore } from '../../application/catalog.store.js';
import { Machine } from '../../domain/model/machine.entity.js';

const route = useRoute();
const router = useRouter();
const store = useCatalogStore();

// Los campos que llenará el usuario
const form = ref({
  name: '',
  brand: '',
  model: '',
  type: 'Excavator',
  hourlyRate: 0,
  status: 'Available'
});

const isEdit = computed(() => !!route.params.id);

// Opciones para los selectores
const typeOptions = ['Excavator', 'Dump Truck', 'Front Loader', 'Drill', 'Tractor'];
const statusOptions = ['Available', 'Rented', 'Under Maintenance'];

onMounted(() => {
  if (isEdit.value) {
    // Si estamos editando, buscamos la máquina y llenamos el formulario
    const existing = store.machines.find(x => x.id === parseInt(route.params.id));
    if (existing) {
      form.value.name = existing.name;
      form.value.brand = existing.brand;
      form.value.model = existing.model;
      form.value.type = existing.type;
      form.value.hourlyRate = existing.hourlyRate;
      form.value.status = existing.status;
    } else {
      router.push({ name: 'catalog-list' });
    }
  }
});

const save = () => {
  // Creamos la nueva máquina con los datos del formulario
  const entity = new Machine({
    id: isEdit.value ? parseInt(route.params.id) : null,
    ownerId: 1, // Por ahora lo dejamos fijo al dueño 1
    name: form.value.name,
    brand: form.value.brand,
    model: form.value.model,
    type: form.value.type,
    hourlyRate: form.value.hourlyRate,
    status: form.value.status
  });

  // Guardamos en la base de datos
  if (isEdit.value) store.updateMachine(entity);
  else store.addMachine(entity);

  // Regresamos a la tabla
  router.push({ name: 'catalog-list' });
};
</script>

<template>
  <div style="max-width: 600px; margin: 0 auto; padding-top: 2rem;">
    <h1>{{ isEdit ? 'Editar Máquina' : 'Nueva Máquina' }}</h1>

    <form @submit.prevent="save" style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1.5rem;">

      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <label for="name">Nombre de la máquina</label>
        <pv-input-text id="name" v-model="form.name" required />
      </div>

      <div style="display: flex; gap: 1rem;">
        <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
          <label for="brand">Marca</label>
          <pv-input-text id="brand" v-model="form.brand" required />
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
          <label for="model">Modelo</label>
          <pv-input-text id="model" v-model="form.model" required />
        </div>
      </div>

      <div style="display: flex; gap: 1rem;">
        <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
          <label for="type">Tipo</label>
          <pv-select id="type" v-model="form.type" :options="typeOptions" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
          <label for="status">Estado</label>
          <pv-select id="status" v-model="form.status" :options="statusOptions" />
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <label for="hourlyRate">Tarifa por Hora (S/)</label>
        <pv-input-number id="hourlyRate" v-model="form.hourlyRate" required />
      </div>

      <div style="display: flex; gap: 1rem; margin-top: 1rem;">
        <pv-button type="submit" label="Guardar" icon="pi pi-save" />
        <pv-button label="Cancelar" severity="secondary" @click="router.push({ name: 'catalog-list' })" />
      </div>

    </form>
  </div>
</template>