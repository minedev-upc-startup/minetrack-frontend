<script setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const year = new Date().getFullYear();
</script>

<template>
  <footer class="app-shell__footer">
    <span>© {{ year }} {{ t('app.name') }}</span>
    <span class="app-shell__tagline">{{ t('app.tagline') }}</span>
  </footer>
</template>

<style scoped>
.app-shell__footer {
  display: flex;
  justify-content: space-between;
  padding: var(--mt-space-4) var(--mt-space-6);
  background: var(--mt-color-bg-elevated);
  border-top: 1px solid var(--mt-color-border-subtle);
  color: var(--mt-color-text-secondary);
  font-size: 12px;
}
.app-shell__tagline { font-style: italic; }
</style>
