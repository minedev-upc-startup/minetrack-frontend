<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import useRentalsStore from '../../application/rentals.store.js';
import useIamStore from '../../../iam/application/iam.store.js';
import useEquipmentStore from '../../../equipment/application/equipment.store.js';

const { t } = useI18n();
const toast = useToast();
const rentals = useRentalsStore();
const iam = useIamStore();
const equipment = useEquipmentStore();

const loaded = ref(false);
const returningId = ref(null);
const imageFailed = reactive({});

function isActiveRental(status) {
  const normalized = String(status).toLowerCase();
  return normalized === 'active' || normalized === 'approved';
}

const activeRentals = computed(() =>
    rentals.requests.filter(request => isActiveRental(request.status))
);

onMounted(async () => {
  await Promise.all([
    equipment.fetchMachines(),
    rentals.fetchRequests({ clientId: iam.currentUserId })
  ]);
  loaded.value = true;
});

function machinesByIdMap() {
  return Object.fromEntries(equipment.machines.map(machine => [machine.id, machine]));
}

function machineLabel(request) {
  const machine = machinesByIdMap()[request.machineId];
  if (!machine) return `Machine #${request.machineId}`;
  return `${machine.brand} ${machine.model}`.trim() || machine.name;
}

function machineTypeIcon(type) {
  const icons = {
    Excavator: 'pi pi-cog',
    'Front Loader': 'pi pi-box',
    'Dump Truck': 'pi pi-truck',
    Drill: 'pi pi-bolt',
    Tractor: 'pi pi-sliders-h'
  };
  return icons[type] || 'pi pi-wrench';
}

function photoSrc(request) {
  const machine = machinesByIdMap()[request.machineId];
  const path = machine?.photos?.[0];
  if (!path || typeof path !== 'string') return null;
  const base = import.meta.env.BASE_URL || '/';
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${normalized}`;
}

function onImgError(id) {
  imageFailed[id] = true;
}

function formatDate(value) {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function estimatedTotal(request) {
  if (request.estimatedTotalCost != null) return request.estimatedTotalCost;
  const machine = machinesByIdMap()[request.machineId];
  if (!machine?.hourlyRate || !request.startDate || !request.endDate) return 0;
  const start = new Date(`${request.startDate}T00:00:00`);
  const end = new Date(`${request.endDate}T00:00:00`);
  const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  return days * (machine.dailyMinimumHours ?? 8) * machine.hourlyRate;
}

async function returnMachine(request) {
  returningId.value = request.id;
  const success = await rentals.returnMachine(request.id);
  returningId.value = null;

  if (success) {
    const machine = machinesByIdMap()[request.machineId];
    if (machine) {
      await equipment.patchMachine(machine, { status: 'Available' });
    }
    toast.add({
      severity: 'success',
      summary: t('clientRentals.returnSuccessTitle'),
      detail: t('clientRentals.returnSuccessDetail', { name: machineLabel(request) }),
      life: 4000
    });
    return;
  }

  toast.add({
    severity: 'error',
    summary: t('clientRentals.returnErrorTitle'),
    detail: t('clientRentals.returnErrorDetail'),
    life: 4000
  });
}
</script>

<template>
  <section class="client-rentals">
    <pv-toast />

    <header class="client-rentals__header">
      <div>
        <h1 class="client-rentals__title">{{ t('clientRentals.title') }}</h1>
      </div>
      <span class="client-rentals__count">{{ t('clientRentals.activeCount', { count: activeRentals.length }) }}</span>
    </header>

    <div v-if="!loaded" class="client-rentals__state">
      <i class="pi pi-spin pi-spinner" />
      <span>{{ t('clientRentals.loading') }}</span>
    </div>

    <div v-else-if="!activeRentals.length" class="client-rentals__state client-rentals__state--empty">
      <i class="pi pi-truck" />
      <span>{{ t('clientRentals.empty') }}</span>
    </div>

    <transition-group v-else name="rental-card" tag="div" class="client-rentals__grid">
      <article v-for="rental in activeRentals" :key="rental.id" class="rental-card">
        <div class="rental-card__media">
          <img
              v-if="photoSrc(rental) && !imageFailed[rental.id]"
              :src="photoSrc(rental)"
              :alt="machineLabel(rental)"
              loading="lazy"
              @error="onImgError(rental.id)"
          >
          <div v-else class="rental-card__placeholder">
            <i :class="machineTypeIcon(machinesByIdMap()[rental.machineId]?.type)" />
          </div>
          <span class="rental-card__status">{{ t('clientRentals.inOperation') }}</span>
        </div>

        <div class="rental-card__body">
          <h2>{{ machineLabel(rental) }}</h2>
          <p class="rental-card__dates">
            {{ t('rentals.dateRange', { start: formatDate(rental.startDate), end: formatDate(rental.endDate) }) }}
          </p>

          <dl class="rental-card__facts">
            <div>
              <dt>{{ t('clientRentals.contractValue') }}</dt>
              <dd>{{ formatMoney(estimatedTotal(rental)) }}</dd>
            </div>
            <div>
              <dt>{{ t('clientRentals.custody') }}</dt>
              <dd>{{ t('clientRentals.underYourOperation') }}</dd>
            </div>
          </dl>

          <button
              type="button"
              class="rental-card__return"
              :disabled="returningId === rental.id"
              @click="returnMachine(rental)"
          >
            <i :class="returningId === rental.id ? 'pi pi-spin pi-spinner' : 'pi pi-sign-out'" />
            {{ t('clientRentals.returnMachine') }}
          </button>
        </div>
      </article>
    </transition-group>
  </section>
</template>

<style scoped>
.client-rentals {
  color: #f8fafc;
}

.client-rentals__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.client-rentals__title {
  margin: 0;
  font-family: 'Playfair Display', var(--mt-font-display);
  font-size: 34px;
  font-weight: 700;
}

.client-rentals__count {
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.28);
  color: #86efac;
  font-size: 12px;
  font-weight: 600;
}

.client-rentals__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 260px;
  color: #94a3b8;
  border-radius: 16px;
  border: 1px dashed rgba(148, 163, 184, 0.18);
  background: rgba(26, 34, 52, 0.45);
}

.client-rentals__state--empty {
  flex-direction: column;
  gap: 12px;
}

.client-rentals__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.rental-card {
  display: grid;
  grid-template-columns: 220px 1fr;
  border-radius: 16px;
  background: #1a2234;
  border: 1px solid rgba(148, 163, 184, 0.08);
  overflow: hidden;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.rental-card:hover {
  transform: translateY(-3px);
  border-color: rgba(34, 197, 94, 0.32);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);
}

.rental-card__media {
  position: relative;
  min-height: 220px;
  background:
    radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.12), transparent 45%),
    linear-gradient(145deg, #111827 0%, #1e293b 100%);
}

.rental-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rental-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86efac;
  font-size: 42px;
}

.rental-card__status {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid rgba(34, 197, 94, 0.32);
  color: #86efac;
  font-size: 11px;
  font-weight: 700;
}

.rental-card__body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
}

.rental-card__body h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.rental-card__dates {
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 13px;
}

.rental-card__facts {
  display: grid;
  gap: 10px;
  margin: 18px 0;
}

.rental-card__facts div {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.08);
}

.rental-card__facts dt {
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.rental-card__facts dd {
  margin: 6px 0 0;
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 600;
}

.rental-card__return {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 12px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  color: #fecaca;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.rental-card__return:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.16);
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-1px);
}

.rental-card__return:disabled {
  opacity: 0.7;
  cursor: wait;
}

.rental-card-move {
  transition: transform 0.35s ease;
}

.rental-card-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.rental-card-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

@media (max-width: 960px) {
  .client-rentals__grid,
  .rental-card {
    grid-template-columns: 1fr;
  }

  .rental-card__media {
    min-height: 180px;
  }
}
</style>
