<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import useTemplateStore from '../../application/_template.store.js';
import { Example } from '../../domain/model/example.entity.js';

const route = useRoute();
const router = useRouter();
const store = useTemplateStore();

const form = ref({ name: '' });
const isEdit = computed(() => !!route.params.id);

onMounted(() => {
  if (isEdit.value) {
    const existing = store.examples.find(x => x.id === parseInt(route.params.id));
    if (existing) form.value.name = existing.name;
    else router.push({ name: 'template-list' });
  }
});

const save = () => {
  const entity = new Example({
    id: isEdit.value ? parseInt(route.params.id) : null,
    name: form.value.name
  });
  if (isEdit.value) store.updateExample(entity);
  else store.addExample(entity);
  router.push({ name: 'template-list' });
};
</script>

<template>
  <div>
    <h1>{{ isEdit ? 'Edit example' : 'New example' }}</h1>
    <form @submit.prevent="save">
      <div class="field">
        <label for="name">Name</label>
        <pv-input-text id="name" v-model="form.name" required class="w-full" />
      </div>
      <pv-button type="submit" label="Save" icon="pi pi-save" />
      <pv-button label="Cancel" severity="secondary" class="ml-2" @click="router.push({ name: 'template-list' })" />
    </form>
  </div>
</template>
