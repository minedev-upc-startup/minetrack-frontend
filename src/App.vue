<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import LegacyLayout from './shared/presentation/components/layout.vue';
import ClientLayout from './shared/presentation/layouts/client-layout.vue';
import OwnerLayout from './shared/presentation/layouts/owner-layout.vue';

const layouts = {
  client: ClientLayout,
  owner: OwnerLayout
};

const route = useRoute();

const layoutComponent = computed(() => {
  const layoutName = route.meta?.layout;
  return layouts[layoutName] ?? LegacyLayout;
});
</script>

<template>
  <component :is="layoutComponent" />
</template>