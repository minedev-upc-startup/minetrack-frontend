<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import LegacyLayout from './shared/presentation/components/layout.vue';
import DashboardLayout from './shared/presentation/layouts/dashboard-layout.vue';

const layouts = {
    dashboard: DashboardLayout
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
