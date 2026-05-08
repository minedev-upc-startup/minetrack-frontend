<script setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<template>
  <section>
    <h1>{{ t('about.title') }}</h1>
    <p>{{ t('about.body') }}</p>
  </section>
</template>
