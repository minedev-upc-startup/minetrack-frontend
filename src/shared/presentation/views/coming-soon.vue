<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <section class="coming-soon">
    <h1>{{ route.meta.title }}</h1>
    <p class="coming-soon__hint">
      This view is reserved for the bounded context owner.
      Replace this placeholder with the real implementation.
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