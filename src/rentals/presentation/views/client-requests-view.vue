<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import useRentalsStore from '../../application/rentals.store.js';
import useIamStore from '../../../iam/application/iam.store.js';
import useEquipmentStore from '../../../equipment/application/equipment.store.js';

const { t } = useI18n();
const rentals = useRentalsStore();
const iam = useIamStore();
const equipment = useEquipmentStore();

const loaded = ref(false);
const imageFailed = reactive({});

const sortedRequests = computed(() =>
    [...rentals.requests].sort((left, right) => String(right.submittedAt ?? right.startDate).localeCompare(String(left.submittedAt ?? left.startDate)))
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

function statusClass(status) {
  const normalized = String(status).toLowerCase();
  if (normalized === 'pending') return 'request-card__badge--pending';
  if (normalized === 'approved' || normalized === 'active') return 'request-card__badge--approved';
  if (normalized === 'rejected') return 'request-card__badge--rejected';
  return 'request-card__badge--default';
}

function statusLabel(status) {
  const normalized = String(status).replace(/\s+/g, '');
  const key = `dashboard.requestStatus.${normalized}`;
  const translated = t(key);
  return translated === key ? status : translated;
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
</script>

<template>
  <section class="client-requests">
    <header class="client-requests__header">
      <div>
        <h1 class="client-requests__title">{{ t('clientRequests.title') }}</h1>
        <p class="client-requests__intro">{{ t('clientRequests.intro') }}</p>
      </div>
      <span class="client-requests__count">{{ t('clientRequests.total', { count: rentals.requests.length }) }}</span>
    </header>

    <div v-if="!loaded" class="client-requests__state">
      <i class="pi pi-spin pi-spinner" />
      <span>{{ t('clientRequests.loading') }}</span>
    </div>

    <div v-else-if="!sortedRequests.length" class="client-requests__state client-requests__state--empty">
      <i class="pi pi-inbox" />
      <span>{{ t('clientRequests.empty') }}</span>
    </div>

    <transition-group v-else name="request-card" tag="div" class="client-requests__grid">
      <article
          v-for="request in sortedRequests"
          :key="request.id"
          class="request-card"
          :class="`request-card--${String(request.status).toLowerCase()}`"
      >
        <div class="request-card__media">
          <img
              v-if="photoSrc(request) && !imageFailed[request.id]"
              :src="photoSrc(request)"
              :alt="machineLabel(request)"
              loading="lazy"
              @error="onImgError(request.id)"
          >
          <div v-else class="request-card__placeholder">
            <i :class="machineTypeIcon(machinesByIdMap()[request.machineId]?.type)" />
          </div>
        </div>

        <div class="request-card__body">
          <div class="request-card__top">
            <h2>{{ machineLabel(request) }}</h2>
            <span class="request-card__badge" :class="statusClass(request.status)">
              {{ statusLabel(request.status) }}
            </span>
          </div>

          <dl class="request-card__facts">
            <div>
              <dt>{{ t('clientRequests.dates') }}</dt>
              <dd>{{ t('rentals.dateRange', { start: formatDate(request.startDate), end: formatDate(request.endDate) }) }}</dd>
            </div>
            <div>
              <dt>{{ t('clientRequests.estimatedCost') }}</dt>
              <dd class="request-card__amount">{{ formatMoney(estimatedTotal(request)) }}</dd>
            </div>
          </dl>
        </div>
      </article>
    </transition-group>
  </section>
</template>

<style scoped>
.client-requests {
  color: #f8fafc;
}

.client-requests__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.client-requests__title {
  margin: 0 0 8px;
  font-family: 'Playfair Display', var(--mt-font-display);
  font-size: 34px;
  font-weight: 700;
}

.client-requests__intro {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
}

.client-requests__count {
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(245, 166, 35, 0.12);
  border: 1px solid rgba(245, 166, 35, 0.28);
  color: #fde68a;
  font-size: 12px;
  font-weight: 600;
}

.client-requests__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 240px;
  color: #94a3b8;
  border-radius: 16px;
  border: 1px dashed rgba(148, 163, 184, 0.18);
  background: rgba(26, 34, 52, 0.45);
}

.client-requests__state--empty {
  flex-direction: column;
  gap: 12px;
}

.client-requests__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.request-card {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: #1a2234;
  border: 1px solid rgba(148, 163, 184, 0.08);
  overflow: hidden;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.request-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.24);
}

.request-card--pending:hover { border-color: rgba(245, 158, 11, 0.35); }
.request-card--approved:hover,
.request-card--active:hover { border-color: rgba(34, 197, 94, 0.35); }
.request-card--rejected:hover { border-color: rgba(239, 68, 68, 0.35); }

.request-card__media {
  height: 140px;
  background:
    radial-gradient(circle at 20% 20%, rgba(245, 166, 35, 0.12), transparent 45%),
    linear-gradient(145deg, #111827 0%, #1e293b 100%);
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.request-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.request-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mt-color-primary);
  font-size: 36px;
}

.request-card__body {
  padding: 16px 18px 18px;
}

.request-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.request-card__top h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}

.request-card__badge {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.request-card__badge--pending {
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.32);
  color: #fde68a;
}

.request-card__badge--approved {
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.32);
  color: #86efac;
}

.request-card__badge--rejected {
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.32);
  color: #fecaca;
}

.request-card__facts {
  display: grid;
  gap: 10px;
  margin: 0;
}

.request-card__facts div {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.08);
}

.request-card__facts dt {
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.request-card__facts dd {
  margin: 6px 0 0;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 600;
}

.request-card__amount {
  color: var(--mt-color-primary) !important;
}

.request-card-move {
  transition: transform 0.35s ease;
}

.request-card-enter-active,
.request-card-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.request-card-enter-from,
.request-card-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (max-width: 1100px) {
  .client-requests__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .client-requests__grid {
    grid-template-columns: 1fr;
  }
}
</style>
