<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
const { t } = useI18n();
const router = useRouter();
</script>

<template>
  <section>
    <h1>403</h1>
    <p>{{ t('errors.forbidden') }}</p>
    <pv-button :label="t('nav.home')" @click="router.push({ name: 'home' })" />
  </section>
</template>
