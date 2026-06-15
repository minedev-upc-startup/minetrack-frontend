<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import Topbar from '../components/topbar.vue';
import DashboardSidebar from '../components/dashboard-sidebar.vue';
import useIamStore from '../../../iam/application/iam.store.js';
import { getSidebarItemsForRole } from '../../infrastructure/navigation-by-role.js';

const route = useRoute();
const iam = useIamStore();
const { currentUserRole } = storeToRefs(iam);
const sidebarCollapsed = ref(false);

const sidebarItems = computed(() => getSidebarItemsForRole(currentUserRole.value));
const isCatalogShell = computed(() => Boolean(route.meta?.catalogShell));

function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
}
</script>

<template>
  <div class="dashboard-layout" :class="{ 'dashboard-layout--catalog': isCatalogShell }">
    <Topbar :show-nav-toggle="!isCatalogShell" @toggle-nav="toggleSidebar" />
    <div class="dashboard-layout__body">
      <DashboardSidebar
          v-if="!isCatalogShell"
          :items="sidebarItems"
          :collapsed="sidebarCollapsed"
      />
      <main class="dashboard-layout__main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #0f172a;
}

.dashboard-layout__body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.dashboard-layout__main {
  flex: 1;
  padding: 28px 32px 40px;
  overflow: auto;
  box-sizing: border-box;
  background: #0f172a;
}

.dashboard-layout--catalog .dashboard-layout__main {
  padding: 24px 40px 48px;
}
</style>
