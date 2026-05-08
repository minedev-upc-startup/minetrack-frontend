<script setup>
import { onMounted, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useTemplateStore from '../../application/_template.store.js';

const { t } = useI18n();
const router = useRouter();
const store = useTemplateStore();
const { examples, examplesLoaded, errors } = toRefs(store);
const { fetchExamples, deleteExample } = store;

onMounted(() => { if (!examplesLoaded.value) fetchExamples(); });
</script>

<template>
  <div>
    <h1>Examples</h1>
    <pv-button label="New" icon="pi pi-plus" @click="router.push({ name: 'template-new' })" />
    <pv-data-table :value="examples" :loading="!examplesLoaded" striped-rows class="mt-3">
      <pv-column field="id" header="ID" sortable />
      <pv-column field="name" header="Name" sortable />
      <pv-column header="Actions">
        <template #body="slotProps">
          <pv-button icon="pi pi-pencil" text rounded @click="router.push({ name: 'template-edit', params: { id: slotProps.data.id } })" />
          <pv-button icon="pi pi-trash" text rounded severity="danger" @click="deleteExample(slotProps.data)" />
        </template>
      </pv-column>
    </pv-data-table>
    <div v-if="errors.length" class="error">{{ errors.map(e => e.message).join(', ') }}</div>
  </div>
</template>
