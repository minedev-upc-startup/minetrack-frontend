<script setup>
import { useI18n } from 'vue-i18n';
import { ref, watch } from 'vue';

const { locale } = useI18n();
const selected = ref(locale.value);
const options = [
  { label: 'EN', value: 'en' },
  { label: 'ES', value: 'es' }
];

watch(selected, value => { locale.value = value; });
</script>

<template>
  <pv-select-button v-model="selected" :options="options" optionLabel="label" optionValue="value" />
</template>
