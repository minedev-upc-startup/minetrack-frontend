<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import Topbar from '../components/topbar.vue';
import DashboardSidebar from '../components/dashboard-sidebar.vue';
import FooterContent from '../components/footer-content.vue';
import useIamStore from '../../../iam/application/iam.store.js';
import { getSidebarItemsForRole } from '../../infrastructure/navigation-by-role.js';

const iam = useIamStore();
const { currentUserRole } = storeToRefs(iam);
const sidebarCollapsed = ref(false);

const sidebarItems = computed(() => getSidebarItemsForRole(currentUserRole.value));

function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
}
</script>

<template>
  <div class="dashboard-layout">
    <Topbar show-nav-toggle @toggle-nav="toggleSidebar" />
    <div class="dashboard-layout__body">
      <DashboardSidebar :items="sidebarItems" :collapsed="sidebarCollapsed" />
      <main class="dashboard-layout__main">
        <router-view />
      </main>
    </div>
    <FooterContent />
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.dashboard-layout__body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.dashboard-layout__main {
  flex: 1;
  padding: var(--mt-space-6);
  overflow: auto;
  box-sizing: border-box;
}
</style>
