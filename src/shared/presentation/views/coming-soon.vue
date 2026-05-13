<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const { t } = useI18n();

const heading = computed(() => {
    const key = route.meta.titleKey;
    if (key) return t(key);
    return route.meta.title ?? '';
});

const hint = computed(() => t('common.comingSoonHint'));
</script>

<template>
  <section class="coming-soon">
    <h1>{{ heading }}</h1>
    <p class="coming-soon__hint">
      {{ hint }}
    </p>
  </section>
</template>

<style scoped>
.coming-soon {
  padding: var(--mt-space-8);
  border: 1px dashed var(--mt-color-border-subtle);
  border-radius: var(--mt-radius-md);
  text-align: center;
}
.coming-soon__hint {
  color: var(--mt-color-text-secondary);
  font-size: 14px;
  margin-top: var(--mt-space-3);
}
</style>