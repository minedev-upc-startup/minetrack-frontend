<script setup>
import Topbar from '../components/topbar.vue';
import Sidebar from '../components/sidebar.vue';
import FooterContent from '../components/footer-content.vue';

const sidebarItems = [
  { labelKey: 'nav.catalog',    routeName: 'catalog-list',     icon: 'pi pi-list' },
  { labelKey: 'nav.myRentals',  routeName: 'client-rentals',   icon: 'pi pi-file' }
];
</script>

<template>
  <div class="client-layout">
    <Topbar />
    <div class="client-layout__body">
      <Sidebar :items="sidebarItems" />
      <main class="client-layout__main">
        <router-view />
      </main>
    </div>
    <FooterContent />
  </div>
</template>

<style scoped>
.client-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.client-layout__body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.client-layout__main {
  flex: 1;
  padding: var(--mt-space-6);
  overflow: auto;
  box-sizing: border-box;
}
</style>