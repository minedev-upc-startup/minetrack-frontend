<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import useRentalsStore from '../../application/rentals.store.js';
import useEquipmentStore from '../../../equipment/application/equipment.store.js';
import useIamStore from '../../../iam/application/iam.store.js';
import { BaseApi } from '../../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js';

const { t } = useI18n();
const toast = useToast();
const rentals = useRentalsStore();
const equipment = useEquipmentStore();
const iam = useIamStore();

const activeTab = ref('pending');
const loaded = ref(false);
const usersById = reactive({});
const imageFailed = reactive({});

const pendingRequests = computed(() =>
    rentals.requests.filter(request => String(request.status).toLowerCase() === 'pending')
);

const activeRentals = computed(() =>
    rentals.requests.filter(request => {
        const status = String(request.status).toLowerCase();
        return status === 'active' || status === 'approved';
    })
);

const machinesById = computed(() =>
    Object.fromEntries(equipment.machines.map(machine => [machine.id, machine]))
);

onMounted(async () => {
    const ownerId = iam.currentUserId;
    if (ownerId == null) {
        loaded.value = true;
        return;
    }

    await Promise.all([
        rentals.fetchRequests({ ownerId }),
        equipment.fetchMachines({ ownerId }),
        loadUsers()
    ]);
    loaded.value = true;
});

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

function clientLabel(clientId) {
    const user = usersById[clientId];
    if (!user) return `Client #${clientId}`;
    return user.company || user.fullName || user.email;
}

function machineForRequest(request) {
    return machinesById.value[request.machineId] ?? null;
}

function machineLabel(request) {
    const machine = machineForRequest(request);
    if (!machine) return `Machine #${request.machineId}`;
    const label = `${machine.brand} ${machine.model}`.trim();
    return label || machine.name;
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

function photoSrc(machine) {
    const path = machine?.photos?.[0];
    if (!path || typeof path !== 'string') return null;
    if (path.startsWith('http')) return path;
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
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function estimatedTotal(request) {
    if (request.estimatedTotalCost != null) return formatMoney(request.estimatedTotalCost);
    const machine = machineForRequest(request);
    if (!machine?.hourlyRate || !request.startDate || !request.endDate) return '—';
    const start = new Date(`${request.startDate}T00:00:00`);
    const end = new Date(`${request.endDate}T00:00:00`);
    const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
    const hours = days * (machine.dailyMinimumHours ?? 8);
    return formatMoney(hours * machine.hourlyRate);
}

async function acceptRental(id) {
    const success = await rentals.acceptRental(id);
    if (success) {
        activeTab.value = 'active';
        toast.add({
            severity: 'success',
            summary: t('rentals.acceptSuccess'),
            detail: t('rentals.acceptDetail'),
            life: 3500
        });
        return;
    }
    toast.add({
        severity: 'error',
        summary: t('rentals.actionError'),
        life: 3000
    });
}

async function rejectRental(id) {
    const success = await rentals.rejectRental(id);
    if (success) {
        toast.add({
            severity: 'warn',
            summary: t('rentals.rejectSuccess'),
            detail: t('rentals.rejectDetail'),
            life: 3500
        });
        return;
    }
    toast.add({
        severity: 'error',
        summary: t('rentals.actionError'),
        life: 3000
    });
}
</script>

<template>
  <section class="owner-rentals">
    <pv-toast />

    <header class="owner-rentals__header">
      <div>
        <h1 class="owner-rentals__title">{{ t('rentals.ownerTitle') }}</h1>
        <p class="owner-rentals__intro">{{ t('rentals.ownerIntro') }}</p>
      </div>
    </header>

    <nav class="owner-rentals__tabs" :aria-label="t('rentals.ownerTitle')">
      <button
          type="button"
          class="owner-rentals__tab"
          :class="{ 'owner-rentals__tab--active': activeTab === 'pending' }"
          @click="activeTab = 'pending'"
      >
        {{ t('rentals.tabPending') }}
        <span class="owner-rentals__tab-count">{{ pendingRequests.length }}</span>
      </button>
      <button
          type="button"
          class="owner-rentals__tab"
          :class="{ 'owner-rentals__tab--active': activeTab === 'active' }"
          @click="activeTab = 'active'"
      >
        {{ t('rentals.tabActive') }}
        <span class="owner-rentals__tab-count">{{ activeRentals.length }}</span>
      </button>
    </nav>

    <div v-if="!loaded" class="owner-rentals__state">
      <i class="pi pi-spin pi-spinner" />
    </div>

    <div v-else-if="activeTab === 'pending'" class="owner-rentals__panel">
      <div v-if="!pendingRequests.length" class="owner-rentals__state owner-rentals__state--empty">
        <i class="pi pi-inbox" />
        <span>{{ t('rentals.pendingEmpty') }}</span>
      </div>

      <transition-group v-else name="rental-card" tag="div" class="owner-rentals__kanban">
        <article
            v-for="request in pendingRequests"
            :key="request.id"
            class="request-card"
        >
          <div class="request-card__header">
            <div class="request-card__client">
              <i class="pi pi-building" aria-hidden="true" />
              <div>
                <span class="request-card__label">{{ t('rentals.clientLabel') }}</span>
                <strong>{{ clientLabel(request.clientId) }}</strong>
              </div>
            </div>
          </div>

          <div class="request-card__machine">
            <div class="request-card__thumb">
              <img
                  v-if="photoSrc(machineForRequest(request)) && !imageFailed[request.id]"
                  :src="photoSrc(machineForRequest(request))"
                  :alt="machineLabel(request)"
                  loading="lazy"
                  @error="onImgError(request.id)"
              >
              <i
                  v-else
                  :class="machineTypeIcon(machineForRequest(request)?.type)"
                  aria-hidden="true"
              />
            </div>
            <div>
              <span class="request-card__label">{{ t('rentals.machineLabel') }}</span>
              <strong>{{ machineLabel(request) }}</strong>
            </div>
          </div>

          <dl class="request-card__facts">
            <div>
              <dt>{{ t('rentals.contractDates') }}</dt>
              <dd>{{ t('rentals.dateRange', { start: formatDate(request.startDate), end: formatDate(request.endDate) }) }}</dd>
            </div>
            <div>
              <dt>{{ t('rentals.estimatedTotal') }}</dt>
              <dd class="request-card__price">{{ estimatedTotal(request) }}</dd>
            </div>
          </dl>

          <div class="request-card__actions">
            <button type="button" class="request-card__accept" @click="acceptRental(request.id)">
              <i class="pi pi-check" />
              {{ t('rentals.acceptRequest') }}
            </button>
            <button type="button" class="request-card__reject" @click="rejectRental(request.id)">
              <i class="pi pi-times" />
              {{ t('rentals.rejectRequest') }}
            </button>
          </div>
        </article>
      </transition-group>
    </div>

    <div v-else class="owner-rentals__panel">
      <div v-if="!activeRentals.length" class="owner-rentals__state owner-rentals__state--empty">
        <i class="pi pi-truck" />
        <span>{{ t('rentals.activeEmpty') }}</span>
      </div>

      <transition-group v-else name="rental-row" tag="div" class="owner-rentals__list">
        <article
            v-for="rental in activeRentals"
            :key="rental.id"
            class="active-row"
        >
          <div class="active-row__main">
            <div class="active-row__thumb">
              <img
                  v-if="photoSrc(machineForRequest(rental)) && !imageFailed[`active-${rental.id}`]"
                  :src="photoSrc(machineForRequest(rental))"
                  :alt="machineLabel(rental)"
                  loading="lazy"
                  @error="onImgError(`active-${rental.id}`)"
              >
              <i
                  v-else
                  :class="machineTypeIcon(machineForRequest(rental)?.type)"
                  aria-hidden="true"
              />
            </div>

            <div class="active-row__content">
              <div class="active-row__top">
                <h2>{{ machineLabel(rental) }}</h2>
                <span class="active-row__badge">{{ t('rentals.statusInOperation') }}</span>
              </div>
              <p class="active-row__client">{{ clientLabel(rental.clientId) }}</p>
              <p class="active-row__dates">
                {{ t('rentals.dateRange', { start: formatDate(rental.startDate), end: formatDate(rental.endDate) }) }}
              </p>
            </div>
          </div>

          <div class="active-row__aside">
            <p class="active-row__total">{{ estimatedTotal(rental) }}</p>
            <button type="button" class="active-row__iot">
              <i class="pi pi-bolt" />
              {{ t('rentals.viewIotStatus') }}
            </button>
          </div>
        </article>
      </transition-group>
    </div>
  </section>
</template>

<style scoped>
.owner-rentals {
  color: var(--mt-color-text-primary);
}

.owner-rentals__header {
  margin-bottom: 24px;
}

.owner-rentals__title {
  margin: 0 0 8px;
  font-family: 'Playfair Display', var(--mt-font-display);
  font-size: 34px;
  font-weight: 700;
  color: #f8fafc;
}

.owner-rentals__intro {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
  max-width: 620px;
}

.owner-rentals__tabs {
  display: inline-flex;
  gap: 8px;
  padding: 6px;
  margin-bottom: 24px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.owner-rentals__tab {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: none;
  border-radius: 999px;
  padding: 11px 18px;
  background: transparent;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.owner-rentals__tab:hover {
  color: #e2e8f0;
}

.owner-rentals__tab--active {
  background: rgba(245, 166, 35, 0.14);
  color: #fde68a;
  box-shadow: inset 0 0 0 1px rgba(245, 166, 35, 0.28);
}

.owner-rentals__tab-count {
  min-width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  font-size: 11px;
}

.owner-rentals__tab--active .owner-rentals__tab-count {
  background: rgba(245, 166, 35, 0.22);
  color: #fff7ed;
}

.owner-rentals__state {
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

.owner-rentals__state--empty {
  flex-direction: column;
  gap: 12px;
}

.owner-rentals__state--empty i {
  font-size: 28px;
  color: #64748b;
}

.owner-rentals__kanban {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

.request-card {
  border-radius: 16px;
  background: #1a2234;
  border: 1px solid rgba(148, 163, 184, 0.08);
  padding: 18px;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.request-card:hover {
  transform: translateY(-3px);
  border-color: rgba(245, 166, 35, 0.28);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.24);
}

.request-card__label {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.request-card__client {
  display: flex;
  align-items: center;
  gap: 12px;
}

.request-card__client i {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 166, 35, 0.12);
  color: var(--mt-color-primary);
}

.request-card__client strong {
  color: #f8fafc;
  font-size: 16px;
}

.request-card__machine {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 16px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.08);
}

.request-card__thumb {
  width: 72px;
  height: 54px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 20% 20%, rgba(245, 166, 35, 0.12), transparent 45%),
    linear-gradient(145deg, #111827 0%, #1e293b 100%);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.request-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.request-card__thumb i {
  color: var(--mt-color-primary);
  font-size: 22px;
}

.request-card__machine strong {
  color: #e2e8f0;
  font-size: 15px;
}

.request-card__facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 16px 0 0;
}

.request-card__facts div {
  padding: 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.45);
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
  font-size: 14px;
  font-weight: 600;
}

.request-card__price {
  color: var(--mt-color-primary) !important;
}

.request-card__actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.request-card__accept,
.request-card__reject {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.request-card__accept {
  border: none;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #ecfdf5;
  box-shadow: 0 10px 24px rgba(34, 197, 94, 0.22);
}

.request-card__accept:hover {
  transform: translateY(-1px);
  filter: brightness(1.04);
}

.request-card__reject {
  border: 1px solid rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.08);
  color: #fecaca;
}

.request-card__reject:hover {
  background: rgba(239, 68, 68, 0.14);
  border-color: rgba(239, 68, 68, 0.5);
}

.owner-rentals__list {
  display: grid;
  gap: 14px;
}

.active-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 18px;
  border-radius: 14px;
  background: #1a2234;
  border: 1px solid rgba(148, 163, 184, 0.08);
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.active-row:hover {
  transform: translateY(-2px);
  border-color: rgba(96, 165, 250, 0.28);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
}

.active-row__main {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.active-row__thumb {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 20% 20%, rgba(96, 165, 250, 0.12), transparent 45%),
    linear-gradient(145deg, #111827 0%, #1e293b 100%);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.active-row__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.active-row__thumb i {
  color: #60a5fa;
  font-size: 24px;
}

.active-row__content {
  min-width: 0;
}

.active-row__top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.active-row__top h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #f8fafc;
}

.active-row__badge {
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.32);
  color: #86efac;
  font-size: 11px;
  font-weight: 700;
}

.active-row__client {
  margin: 6px 0 0;
  color: #94a3b8;
  font-size: 13px;
}

.active-row__dates {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}

.active-row__aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.active-row__total {
  margin: 0;
  color: var(--mt-color-primary);
  font-family: var(--mt-font-display);
  font-size: 18px;
  font-weight: 700;
}

.active-row__iot {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(96, 165, 250, 0.24);
  border-radius: 10px;
  padding: 9px 12px;
  background: rgba(96, 165, 250, 0.08);
  color: #bfdbfe;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.active-row__iot:hover {
  background: rgba(96, 165, 250, 0.14);
  border-color: rgba(96, 165, 250, 0.4);
}

.rental-card-move,
.rental-row-move {
  transition: transform 0.35s ease;
}

.rental-card-enter-active,
.rental-card-leave-active,
.rental-row-enter-active,
.rental-row-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.rental-card-enter-from,
.rental-card-leave-to,
.rental-row-enter-from,
.rental-row-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.rental-card-leave-active,
.rental-row-leave-active {
  position: absolute;
  width: calc(100% - 36px);
}

@media (min-width: 768px) {
  .owner-rentals__kanban {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1200px) {
  .owner-rentals__kanban {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .active-row {
    flex-direction: column;
    align-items: stretch;
  }

  .active-row__aside {
    align-items: stretch;
  }

  .active-row__iot {
    justify-content: center;
  }
}
</style>
