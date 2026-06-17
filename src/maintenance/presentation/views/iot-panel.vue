<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import useRentalsStore from '../../../rentals/application/rentals.store.js';
import useEquipmentStore from '../../../equipment/application/equipment.store.js';
import { BaseApi } from '../../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js';

const { t } = useI18n();
const rentals = useRentalsStore();
const equipment = useEquipmentStore();
const { requests } = storeToRefs(rentals);
const { machines } = storeToRefs(equipment);

const loaded = ref(false);
const sensorData = ref({});
const operationalState = reactive({});
const techniciansDispatched = ref(0);
const usersById = reactive({});
let telemetryTimer = null;

const activeRentals = computed(() =>
    requests.value.filter(request => String(request.status).toLowerCase() === 'active')
);

const machinesById = computed(() =>
    Object.fromEntries(machines.value.map(machine => [machine.id, machine]))
);

const machinesMonitored = computed(() => activeRentals.value.length);

const criticalAlerts = computed(() =>
    activeRentals.value.filter(request => {
        if (operationalState[request.id] === 'maintenance') return false;
        return hasCriticalReading(request.id);
    }).length
);

function randomInRange(min, max, decimals = 1) {
    const value = min + Math.random() * (max - min);
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function jitter(value, delta, min, max, decimals = 1) {
    return clamp(value + randomInRange(-delta, delta, decimals), min, max);
}

function createInitialSensors() {
    return {
        engineTemp: randomInRange(82, 98),
        fuelLevel: randomInRange(35, 92, 0),
        oilPressure: randomInRange(3.2, 5.1)
    };
}

function createStableSensors() {
    return {
        engineTemp: 88,
        fuelLevel: 72,
        oilPressure: 4.2
    };
}

function initSensorData() {
    const next = { ...sensorData.value };
    activeRentals.value.forEach(request => {
        if (!next[request.id]) {
            next[request.id] = createInitialSensors();
        }
        if (!operationalState[request.id]) {
            operationalState[request.id] = 'operating';
        }
    });
    sensorData.value = next;
}

function tickTelemetry() {
    const next = { ...sensorData.value };
    activeRentals.value.forEach(request => {
        if (operationalState[request.id] === 'maintenance') {
            next[request.id] = createStableSensors();
            return;
        }
        const current = next[request.id] ?? createInitialSensors();
        next[request.id] = {
            engineTemp: jitter(current.engineTemp, 2.5, 80, 110),
            fuelLevel: jitter(current.fuelLevel, 4, 10, 100, 0),
            oilPressure: jitter(current.oilPressure, 0.35, 1.5, 7)
        };
    });
    sensorData.value = next;
}

function engineTempStatus(value) {
    if (value > 100) return 'critical';
    if (value >= 95) return 'warning';
    return 'normal';
}

function fuelStatus(value) {
    if (value <= 15) return 'critical';
    if (value <= 30) return 'warning';
    return 'normal';
}

function oilPressureStatus(value) {
    if (value < 2 || value > 6) return 'critical';
    if (value < 2.5 || value > 5.5) return 'warning';
    return 'normal';
}

function sensorStatus(type, value) {
    if (type === 'engineTemp') return engineTempStatus(value);
    if (type === 'fuelLevel') return fuelStatus(value);
    return oilPressureStatus(value);
}

function hasCriticalReading(requestId) {
    const readings = sensorData.value[requestId];
    if (!readings) return false;
    return (
        engineTempStatus(readings.engineTemp) === 'critical'
        || fuelStatus(readings.fuelLevel) === 'critical'
        || oilPressureStatus(readings.oilPressure) === 'critical'
    );
}

function progressPercent(type, value) {
    if (type === 'engineTemp') {
        return clamp(((value - 80) / 30) * 100, 4, 100);
    }
    if (type === 'fuelLevel') {
        return clamp(value, 4, 100);
    }
    return clamp(((value - 1.5) / 5.5) * 100, 4, 100);
}

function formatSensorValue(type, value) {
    if (type === 'engineTemp') return `${value.toFixed(1)}°C`;
    if (type === 'fuelLevel') return `${Math.round(value)}%`;
    return `${value.toFixed(1)} bar`;
}

function machineLabel(request) {
    const machine = machinesById.value[request.machineId];
    if (!machine) return t('iotPanel.unknownMachine', { id: request.machineId });
    return machine.name || `${machine.brand} ${machine.model}`.trim();
}

function clientCompany(request) {
    const user = usersById[request.clientId];
    return user?.company || user?.fullName || t('iotPanel.unknownClient');
}

function contractLabel(request) {
    return t('iotPanel.contractId', { id: request.id });
}

function isUnderMaintenance(requestId) {
    return operationalState[requestId] === 'maintenance';
}

function cardGlowClass(requestId) {
    if (isUnderMaintenance(requestId)) return 'iot-card--maintenance';
    if (hasCriticalReading(requestId)) return 'iot-card--critical';
    return 'iot-card--healthy';
}

function dispatchTechnician(request) {
    if (isUnderMaintenance(request.id)) return;
    operationalState[request.id] = 'maintenance';
    sensorData.value = {
        ...sensorData.value,
        [request.id]: createStableSensors()
    };
    techniciansDispatched.value += 1;
}

async function loadUsers() {
    try {
        const api = new BaseApi();
        const usersPath = import.meta.env.VITE_USERS_ENDPOINT_PATH ?? '/users';
        const endpoint = new BaseEndpoint(api, usersPath);
        const response = await endpoint.getAll();
        response.data.forEach(user => {
            usersById[user.id] = user;
        });
    } catch (error) {
        console.error(error);
    }
}

watch(activeRentals, () => {
    initSensorData();
}, { deep: true });

onMounted(async () => {
    await Promise.all([
        rentals.fetchRequests(),
        equipment.fetchMachines(),
        loadUsers()
    ]);
    initSensorData();
    telemetryTimer = setInterval(tickTelemetry, 3000);
    loaded.value = true;
});

onUnmounted(() => {
    if (telemetryTimer) clearInterval(telemetryTimer);
});
</script>

<template>
  <section class="iot-command">
    <header class="iot-command__hero">
      <div class="iot-command__hero-copy">
        <p class="iot-command__eyebrow">{{ t('iotPanel.eyebrow') }}</p>
        <h1 class="iot-command__title">{{ t('iotPanel.title') }}</h1>
        <p class="iot-command__subtitle">{{ t('iotPanel.subtitle') }}</p>
      </div>
      <div class="iot-command__pulse" aria-hidden="true">
        <span class="iot-command__pulse-ring" />
        <span class="iot-command__pulse-core" />
      </div>
    </header>

    <div class="iot-command__kpis">
      <article class="iot-kpi">
        <span class="iot-kpi__label">{{ t('iotPanel.kpiMonitored') }}</span>
        <strong class="iot-kpi__value">{{ machinesMonitored }}</strong>
        <span class="iot-kpi__hint">{{ t('iotPanel.kpiMonitoredHint') }}</span>
      </article>
      <article class="iot-kpi" :class="{ 'iot-kpi--alert': criticalAlerts > 0 }">
        <span class="iot-kpi__label">{{ t('iotPanel.kpiCritical') }}</span>
        <strong class="iot-kpi__value">{{ criticalAlerts }}</strong>
        <span class="iot-kpi__hint">{{ t('iotPanel.kpiCriticalHint') }}</span>
      </article>
      <article class="iot-kpi iot-kpi--dispatch">
        <span class="iot-kpi__label">{{ t('iotPanel.kpiDispatched') }}</span>
        <strong class="iot-kpi__value">{{ techniciansDispatched }}</strong>
        <span class="iot-kpi__hint">{{ t('iotPanel.kpiDispatchedHint') }}</span>
      </article>
    </div>

    <div v-if="!loaded" class="iot-command__loading">
      <span class="iot-command__loading-dot" />
      <span>{{ t('iotPanel.loading') }}</span>
    </div>

    <div v-else-if="activeRentals.length === 0" class="iot-command__empty">
      <i class="pi pi-wifi iot-command__empty-icon" aria-hidden="true" />
      <h2>{{ t('iotPanel.emptyTitle') }}</h2>
      <p>{{ t('iotPanel.emptyHint') }}</p>
    </div>

    <TransitionGroup v-else name="iot-grid" tag="div" class="iot-command__grid">
      <article
          v-for="request in activeRentals"
          :key="request.id"
          class="iot-card"
          :class="cardGlowClass(request.id)"
      >
        <header class="iot-card__header">
          <div>
            <div class="iot-card__live">
              <span
                  class="iot-card__live-dot"
                  :class="{ 'iot-card__live-dot--paused': isUnderMaintenance(request.id) }"
              />
              <span>{{ isUnderMaintenance(request.id) ? t('iotPanel.stabilized') : t('iotPanel.live') }}</span>
            </div>
            <h2 class="iot-card__machine">{{ machineLabel(request) }}</h2>
            <p class="iot-card__meta">{{ contractLabel(request) }}</p>
            <p class="iot-card__client">{{ clientCompany(request) }}</p>
          </div>
          <span
              class="iot-card__badge"
              :class="isUnderMaintenance(request.id) ? 'iot-card__badge--maintenance' : 'iot-card__badge--operating'"
          >
            {{ isUnderMaintenance(request.id) ? t('iotPanel.underMaintenance') : t('iotPanel.inOperation') }}
          </span>
        </header>

        <div class="iot-card__sensors">
          <div
              v-for="sensor in [
                { key: 'engineTemp', label: t('iotPanel.engineTemp') },
                { key: 'fuelLevel', label: t('iotPanel.fuelLevel') },
                { key: 'oilPressure', label: t('iotPanel.oilPressure') }
              ]"
              :key="sensor.key"
              class="iot-sensor"
          >
            <div class="iot-sensor__head">
              <span>{{ sensor.label }}</span>
              <Transition name="sensor-value" mode="out-in">
                <strong
                    :key="`${request.id}-${sensor.key}-${sensorData[request.id]?.[sensor.key]}`"
                    class="iot-sensor__value"
                    :class="`iot-sensor__value--${sensorStatus(sensor.key, sensorData[request.id]?.[sensor.key] ?? 0)}`"
                >
                  {{ formatSensorValue(sensor.key, sensorData[request.id]?.[sensor.key] ?? 0) }}
                </strong>
              </Transition>
            </div>
            <div class="iot-sensor__track">
              <div
                  class="iot-sensor__fill"
                  :class="`iot-sensor__fill--${sensorStatus(sensor.key, sensorData[request.id]?.[sensor.key] ?? 0)}`"
                  :style="{ width: `${progressPercent(sensor.key, sensorData[request.id]?.[sensor.key] ?? 0)}%` }"
              />
            </div>
          </div>
        </div>

        <footer class="iot-card__footer">
          <button
              type="button"
              class="iot-card__dispatch"
              :disabled="isUnderMaintenance(request.id)"
              @click="dispatchTechnician(request)"
          >
            <i class="pi pi-send" aria-hidden="true" />
            {{ t('iotPanel.dispatchTechnician') }}
          </button>
        </footer>
      </article>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.iot-command {
  display: flex;
  flex-direction: column;
  gap: var(--mt-space-6);
  color: var(--mt-color-text-primary);
}

.iot-command__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mt-space-6);
  padding: var(--mt-space-6);
  border-radius: 18px;
  border: 1px solid rgba(100, 181, 246, 0.12);
  background:
    radial-gradient(circle at top right, rgba(100, 181, 246, 0.12), transparent 42%),
    linear-gradient(135deg, #121722 0%, #171d2b 55%, #10141f 100%);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
}

.iot-command__eyebrow {
  margin: 0 0 8px;
  color: #64b5f6;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.iot-command__title {
  margin: 0;
  font-family: var(--mt-font-display);
  font-size: clamp(28px, 3vw, 38px);
  font-weight: 700;
  line-height: 1.1;
}

.iot-command__subtitle {
  margin: 10px 0 0;
  max-width: 640px;
  color: var(--mt-color-text-secondary);
  font-size: 15px;
  line-height: 1.5;
}

.iot-command__pulse {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}

.iot-command__pulse-ring,
.iot-command__pulse-core {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.iot-command__pulse-ring {
  border: 1px solid rgba(100, 181, 246, 0.35);
  animation: pulse-ring 2.4s ease-out infinite;
}

.iot-command__pulse-core {
  inset: 18px;
  background: radial-gradient(circle, #64b5f6 0%, rgba(100, 181, 246, 0.15) 72%);
  box-shadow: 0 0 24px rgba(100, 181, 246, 0.45);
}

.iot-command__kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--mt-space-4);
}

.iot-kpi {
  padding: 20px 22px;
  border-radius: 16px;
  background: rgba(26, 34, 52, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.08);
  transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
}

.iot-kpi:hover {
  transform: translateY(-2px);
}

.iot-kpi--alert {
  border-color: rgba(239, 68, 68, 0.35);
  box-shadow: 0 0 28px rgba(239, 68, 68, 0.16);
}

.iot-kpi--dispatch {
  border-color: rgba(76, 175, 80, 0.22);
  box-shadow: 0 0 24px rgba(76, 175, 80, 0.08);
}

.iot-kpi__label {
  display: block;
  color: var(--mt-color-text-secondary);
  font-size: 13px;
}

.iot-kpi__value {
  display: block;
  margin-top: 10px;
  font-family: var(--mt-font-display);
  font-size: 34px;
  line-height: 1;
}

.iot-kpi__hint {
  display: block;
  margin-top: 8px;
  color: #64748b;
  font-size: 12px;
}

.iot-command__loading,
.iot-command__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 280px;
  padding: var(--mt-space-8);
  border-radius: 18px;
  border: 1px dashed rgba(148, 163, 184, 0.18);
  background: rgba(17, 24, 39, 0.55);
  text-align: center;
}

.iot-command__loading-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #64b5f6;
  animation: blink 1s ease-in-out infinite;
}

.iot-command__empty-icon {
  font-size: 42px;
  color: #475569;
}

.iot-command__empty h2 {
  margin: 0;
  font-size: 22px;
}

.iot-command__empty p {
  margin: 0;
  max-width: 460px;
  color: var(--mt-color-text-secondary);
}

.iot-command__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--mt-space-4);
}

.iot-card {
  display: flex;
  flex-direction: column;
  gap: var(--mt-space-4);
  padding: 22px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(23, 29, 43, 0.98) 0%, rgba(15, 20, 31, 0.98) 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  transition:
    transform 0.25s ease,
    box-shadow 0.35s ease,
    border-color 0.35s ease,
    opacity 0.35s ease;
}

.iot-card--healthy {
  box-shadow: 0 0 0 1px rgba(76, 175, 80, 0.08), 0 16px 34px rgba(0, 0, 0, 0.24);
}

.iot-card--critical {
  border-color: rgba(239, 68, 68, 0.42);
  box-shadow: 0 0 28px rgba(239, 68, 68, 0.18), 0 18px 36px rgba(0, 0, 0, 0.28);
}

.iot-card--maintenance {
  border-color: rgba(100, 181, 246, 0.35);
  box-shadow: 0 0 24px rgba(100, 181, 246, 0.14), 0 18px 36px rgba(0, 0, 0, 0.28);
  opacity: 0.92;
}

.iot-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mt-space-3);
}

.iot-card__live {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.iot-card__live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.8);
  animation: blink 1.4s ease-in-out infinite;
}

.iot-card__live-dot--paused {
  background: #64b5f6;
  box-shadow: 0 0 10px rgba(100, 181, 246, 0.7);
  animation: none;
}

.iot-card__machine {
  margin: 0;
  font-family: var(--mt-font-display);
  font-size: 22px;
  line-height: 1.2;
}

.iot-card__meta,
.iot-card__client {
  margin: 6px 0 0;
  color: var(--mt-color-text-secondary);
  font-size: 13px;
}

.iot-card__client {
  color: #cbd5e1;
}

.iot-card__badge {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.iot-card__badge--operating {
  color: #86efac;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.28);
}

.iot-card__badge--maintenance {
  color: #93c5fd;
  background: rgba(100, 181, 246, 0.12);
  border: 1px solid rgba(100, 181, 246, 0.28);
}

.iot-card__sensors {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.iot-sensor__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #94a3b8;
}

.iot-sensor__value {
  font-family: var(--mt-font-display);
  font-size: 15px;
}

.iot-sensor__value--normal { color: #86efac; }
.iot-sensor__value--warning { color: #fdba74; }
.iot-sensor__value--critical { color: #fca5a5; }

.iot-sensor__track {
  height: 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  overflow: hidden;
}

.iot-sensor__fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.8s ease, background 0.35s ease, box-shadow 0.35s ease;
}

.iot-sensor__fill--normal {
  background: linear-gradient(90deg, #166534, #22c55e);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.35);
}

.iot-sensor__fill--warning {
  background: linear-gradient(90deg, #c2410c, #fb923c);
  box-shadow: 0 0 12px rgba(251, 146, 60, 0.35);
}

.iot-sensor__fill--critical {
  background: linear-gradient(90deg, #991b1b, #ef4444);
  box-shadow: 0 0 14px rgba(239, 68, 68, 0.45);
}

.iot-card__footer {
  margin-top: auto;
  padding-top: 4px;
}

.iot-card__dispatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(245, 166, 35, 0.35);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(245, 166, 35, 0.18), rgba(245, 166, 35, 0.08));
  color: #fde68a;
  font-family: var(--mt-font-display);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.iot-card__dispatch:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(245, 166, 35, 0.18);
}

.iot-card__dispatch:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  border-color: rgba(100, 181, 246, 0.25);
  background: rgba(100, 181, 246, 0.08);
  color: #93c5fd;
}

.iot-grid-enter-active,
.iot-grid-leave-active {
  transition: all 0.35s ease;
}

.iot-grid-enter-from,
.iot-grid-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.sensor-value-enter-active,
.sensor-value-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.sensor-value-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.sensor-value-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.92);
    opacity: 0.8;
  }
  70% {
    transform: scale(1.18);
    opacity: 0;
  }
  100% {
    transform: scale(1.18);
    opacity: 0;
  }
}

@media (max-width: 960px) {
  .iot-command__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .iot-command__kpis {
    grid-template-columns: 1fr;
  }
}
</style>
