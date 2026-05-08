<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
const { t } = useI18n();
const router = useRouter();
</script>

<template>
  <section>
    <h1>404</h1>
    <p>{{ t('errors.notFound') }}</p>
    <pv-button :label="t('nav.home')" @click="router.push({ name: 'home' })" />
  </section>
</template>
