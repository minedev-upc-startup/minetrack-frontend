<script setup>
import Topbar from '../components/topbar.vue';
import Sidebar from '../components/sidebar.vue';
import FooterContent from '../components/footer-content.vue';

const sidebarItems = [
  { labelKey: 'nav.dashboard',         routeName: 'owner-dashboard',         icon: 'pi pi-th-large' },
  { labelKey: 'nav.myMachines',        routeName: 'owner-machines',          icon: 'pi pi-truck' },
  { labelKey: 'nav.incomingRequests',  routeName: 'owner-incoming-requests', icon: 'pi pi-inbox' },
  { labelKey: 'nav.myRentals',         routeName: 'owner-rentals',           icon: 'pi pi-file' },
  { labelKey: 'nav.iotMonitor',        routeName: 'owner-iot',               icon: 'pi pi-wifi' }
];
</script>

<template>
  <div class="owner-layout">
    <Topbar />
    <div class="owner-layout__body">
      <Sidebar :items="sidebarItems" />
      <main class="owner-layout__main">
        <router-view />
      </main>
    </div>
    <FooterContent />
  </div>
</template>

<style scoped>
.owner-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.owner-layout__body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.owner-layout__main {
  flex: 1;
  padding: var(--mt-space-6);
  overflow: auto;
  box-sizing: border-box;
}
</style>