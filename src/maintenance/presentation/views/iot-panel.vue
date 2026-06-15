<script setup>
import { onMounted } from 'vue';
import useMaintenanceStore from '../../application/maintenance.store.js';

const maintenance = useMaintenanceStore();

onMounted(() => {
    maintenance.fetchAlerts();
});
</script>

<template>
  <section class="iot-panel">
    <h1 class="iot-panel__title">Panel de Monitoreo IoT - Taller de Mantenimiento</h1>
    <p class="iot-panel__hint">
      Alertas registradas: {{ maintenance.alerts.length }}
    </p>
  </section>
</template>

<style scoped>
.iot-panel {
  padding: var(--mt-space-6);
  border: 1px solid rgba(148, 163, 184, 0.08);
  border-radius: 16px;
  background: #111827;
  color: #f8fafc;
}

.iot-panel__title {
  margin: 0;
  font-family: var(--mt-font-display);
  font-size: 28px;
  font-weight: 700;
  color: #f8fafc;
}

.iot-panel__hint {
  margin: 12px 0 0;
  color: #94a3b8;
  font-size: 14px;
}
</style>
