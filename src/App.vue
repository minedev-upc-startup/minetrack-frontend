<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import LegacyLayout from './shared/presentation/components/layout.vue';
import DashboardLayout from './shared/presentation/layouts/dashboard-layout.vue';
import AuthLayout from './shared/presentation/layouts/auth-layout.vue';

const layouts = {
    dashboard: DashboardLayout,
    auth: AuthLayout
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
