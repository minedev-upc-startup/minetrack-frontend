<script setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<template>
  <section>
    <h1>{{ t('home.title') }}</h1>
    <p>{{ t('home.subtitle') }}</p>
  </section>
</template>
