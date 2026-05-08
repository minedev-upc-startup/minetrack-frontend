import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { TemplateApi } from '../infrastructure/_template-api.js';
import { ExampleAssembler } from '../infrastructure/example.assembler.js';

const api = new TemplateApi();

/**
 * Replace with the real store for your bounded context (useCatalogStore, ...).
 */
const useTemplateStore = defineStore('template', () => {
    const examples       = ref([]);
    const examplesLoaded = ref(false);
    const errors         = ref([]);

    const examplesCount = computed(() => examples.value.length);

    async function fetchExamples() {
        try {
            const response = await api.getExamples();
            examples.value = ExampleAssembler.toEntitiesFromResponse(response);
            examplesLoaded.value = true;
        } catch (e) {
            errors.value.push(e);
        }
    }

    async function addExample(example) {
        try {
            const response = await api.createExample(example);
            examples.value.push(ExampleAssembler.toEntityFromResource(response.data));
        } catch (e) {
            errors.value.push(e);
        }
    }

    async function updateExample(example) {
        try {
            const response = await api.updateExample(example);
            const updated = ExampleAssembler.toEntityFromResource(response.data);
            const idx = examples.value.findIndex(x => x.id === updated.id);
            if (idx !== -1) examples.value[idx] = updated;
        } catch (e) {
            errors.value.push(e);
        }
    }

    async function deleteExample(example) {
        try {
            await api.deleteExample(example.id);
            const idx = examples.value.findIndex(x => x.id === example.id);
            if (idx !== -1) examples.value.splice(idx, 1);
        } catch (e) {
            errors.value.push(e);
        }
    }

    return { examples, examplesLoaded, examplesCount, errors,
             fetchExamples, addExample, updateExample, deleteExample };
});

export default useTemplateStore;
