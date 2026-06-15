<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useDashboardStore } from '../../application/dashboard.store.js';
import useIamStore from '../../../iam/application/iam.store.js';
import useEquipmentStore from '../../../equipment/application/equipment.store.js';
import useRentalsStore from '../../../rentals/application/rentals.store.js';
import { DashboardMetric } from '../../domain/model/dashboard-metric.entity.js';
import { DashboardTableRow } from '../../domain/model/dashboard-table-row.entity.js';
import { StatusChartPoint } from '../../domain/model/status-chart-point.entity.js';
import { BaseApi } from '../../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js';
import KpiCard from '../components/kpi-card.vue';
import EarningsAreaChart from '../components/earnings-area-chart.vue';
import StatusBarChart from '../components/status-bar-chart.vue';
import DashboardDataTable from '../components/dashboard-data-table.vue';

const { t } = useI18n();
const router = useRouter();
const dashboard = useDashboardStore();
const iam = useIamStore();
const equipment = useEquipmentStore();
const rentals = useRentalsStore();
const { currentUserRole, currentUserId } = storeToRefs(iam);
const { machines } = storeToRefs(equipment);
const { requests: rentalRequests } = storeToRefs(rentals);

const {
  metrics,
  tableRows,
  earningsSeries,
  statusSeries,
  chartTotal,
  chartGrowth,
  fleetOperational,
  loading,
  viewMode,
  tableMode
} = storeToRefs(dashboard);

const chartPeriod = ref(6);
const tableFilter = ref('all');
const sortKey = ref('sortStart');
const sortDirection = ref('desc');
const selectedKpi = ref(null);
const selectedMonthKey = ref(null);
const ownerDataReady = ref(false);
const usersById = reactive({});

const isOwnerView = computed(() => currentUserRole.value === 'Owner');

function isActiveRentalStatus(status) {
  const normalized = String(status).toLowerCase();
  return normalized === 'active' || normalized === 'approved';
}

function isPendingStatus(status) {
  return String(status).toLowerCase() === 'pending';
}

function machineCode(machine) {
  const prefix = (machine.brand ?? 'MAC').replace(/\s+/g, '').slice(0, 3).toUpperCase();
  return `${prefix}${String(machine.id).padStart(3, '0')}`;
}

function formatDate(isoDate) {
  if (!isoDate) return '—';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function formatMoney(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  if (amount >= 1000) return `S/ ${(amount / 1000).toFixed(1)}k`;
  return `S/ ${Number(amount).toLocaleString('es-PE')}`;
}

function isClosingSoon(endDate) {
  if (!endDate) return false;
  const end = new Date(`${endDate}T00:00:00`);
  const now = new Date();
  const diffDays = (end - now) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 14;
}

function machinesByIdMap() {
  return Object.fromEntries(machines.value.map(machine => [machine.id, machine]));
}

function estimateRentalTotal(request) {
  if (request.estimatedTotalCost != null) return request.estimatedTotalCost;
  const machine = machinesByIdMap()[request.machineId];
  if (!machine?.hourlyRate || !request.startDate || !request.endDate) return 0;
  const start = new Date(`${request.startDate}T00:00:00`);
  const end = new Date(`${request.endDate}T00:00:00`);
  const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  const hours = days * (machine.dailyMinimumHours ?? 8);
  return hours * machine.hourlyRate;
}

const ownerActiveRentals = computed(() =>
    rentalRequests.value.filter(request => isActiveRentalStatus(request.status))
);

const ownerPendingRequests = computed(() =>
    rentalRequests.value.filter(request => isPendingStatus(request.status))
);

const ownerTotalMachines = computed(() => machines.value.length);

const ownerAvailableMachines = computed(() =>
    Math.max(0, ownerTotalMachines.value - ownerActiveRentals.value.length)
);

const ownerMonthlyEarnings = computed(() =>
    ownerActiveRentals.value.reduce((sum, request) => sum + estimateRentalTotal(request), 0)
);

const ownerClosingSoonCount = computed(() =>
    ownerActiveRentals.value.filter(request => isClosingSoon(request.endDate)).length
);

const ownerMetrics = computed(() => [
  new DashboardMetric({
    id: 1,
    title: 'dashboard.kpi.machines',
    value: String(ownerTotalMachines.value),
    subtitle: 'dashboard.kpi.availableCount',
    subtitleParams: { count: ownerAvailableMachines.value },
    routeName: 'owner-machines'
  }),
  new DashboardMetric({
    id: 2,
    title: 'dashboard.kpi.activeRentals',
    value: String(ownerActiveRentals.value.length),
    subtitle: 'dashboard.kpi.closingSoonCount',
    subtitleParams: { count: ownerClosingSoonCount.value },
    routeName: 'owner-active-rentals'
  }),
  new DashboardMetric({
    id: 3,
    title: 'dashboard.kpi.monthEarnings',
    value: formatMoney(ownerMonthlyEarnings.value),
    subtitle: 'dashboard.kpi.projectedFromActive',
    routeName: 'owner-earnings'
  }),
  new DashboardMetric({
    id: 4,
    title: 'dashboard.kpi.pendingRequests',
    value: String(ownerPendingRequests.value.length),
    subtitle: 'dashboard.kpi.awaitingReview',
    routeName: 'owner-active-rentals'
  })
]);

const ownerTableRows = computed(() => {
  const machinesMap = machinesByIdMap();
  return ownerActiveRentals.value.map(request => {
    const machine = machinesMap[request.machineId] ?? {};
    const client = usersById[request.clientId] ?? {};
    return new DashboardTableRow({
      id: request.id,
      machineCode: machine.id ? machineCode(machine) : `RNT${String(request.id).padStart(3, '0')}`,
      machineName: machine.brand && machine.model ? `${machine.brand} ${machine.model}` : machine.name ?? '—',
      clientName: client.company ?? client.fullName ?? '—',
      startDate: formatDate(request.startDate),
      endDate: formatDate(request.endDate),
      status: 'Active',
      statusKey: 'dashboard.status.Active',
      rowType: 'rental',
      sortStart: request.startDate,
      sortEnd: request.endDate,
      linkRoute: 'owner-active-rentals',
      linkParams: {}
    });
  });
});

const ownerStatusSeries = computed(() => [
  new StatusChartPoint({
    label: 'dashboard.status.Active',
    value: ownerActiveRentals.value.length,
    color: '#22c55e',
    filterKey: 'Active'
  }),
  new StatusChartPoint({
    label: 'dashboard.status.Available',
    value: ownerAvailableMachines.value,
    color: '#38bdf8',
    filterKey: 'Available'
  }),
  new StatusChartPoint({
    label: 'dashboard.requestStatus.Pending',
    value: ownerPendingRequests.value.length,
    color: '#f59e0b',
    filterKey: 'Pending'
  })
]);

const ownerFleetOperational = computed(() =>
    ownerPendingRequests.value.length === 0 && ownerTotalMachines.value > 0
);

const displayMetrics = computed(() => (isOwnerView.value ? ownerMetrics.value : metrics.value));
const displayTableRows = computed(() => (isOwnerView.value ? ownerTableRows.value : tableRows.value));
const displayStatusSeries = computed(() => (isOwnerView.value ? ownerStatusSeries.value : statusSeries.value));
const displayFleetOperational = computed(() => (isOwnerView.value ? ownerFleetOperational.value : fleetOperational.value));
const displayTableMode = computed(() => (isOwnerView.value ? 'owner' : tableMode.value));
const isPageLoading = computed(() => (isOwnerView.value ? !ownerDataReady.value : loading.value));

const pageTitle = computed(() => {
  if (viewMode.value === 'owner' || isOwnerView.value) return t('dashboard.fleetTitle');
  if (viewMode.value === 'client') return t('dashboard.clientTitle');
  return t('dashboard.operationsTitle');
});

const statusLabel = computed(() => (
  displayFleetOperational.value ? t('dashboard.statusOperational') : t('dashboard.statusAttention')
));

const visibleChartPoints = computed(() => {
  const slice = chartPeriod.value === 12 ? earningsSeries.value : earningsSeries.value.slice(-6);
  return slice;
});

const visibleChartTotal = computed(() => {
  if (isOwnerView.value) {
    return formatMoney(ownerMonthlyEarnings.value);
  }
  const total = visibleChartPoints.value.reduce((sum, point) => sum + point.value, 0);
  return `${total.toFixed(1)}k`;
});

const visibleChartGrowth = computed(() => {
  if (isOwnerView.value) return null;
  const points = visibleChartPoints.value;
  if (points.length < 2) return null;
  const current = points[points.length - 1].value;
  const previous = points[points.length - 2].value;
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
});

const filteredRows = computed(() => {
  let rows = [...displayTableRows.value];

  if (tableFilter.value !== 'all') {
    if (displayTableMode.value === 'client') {
      rows = rows.filter(row => row.status === tableFilter.value);
    } else if (displayTableMode.value === 'intermediary') {
      if (tableFilter.value === 'Pending') {
        rows = rows.filter(row => row.rowType === 'request');
      } else if (tableFilter.value === 'Active') {
        rows = rows.filter(row => row.rowType === 'rental');
      } else if (tableFilter.value === 'Alerts') {
        rows = [];
      }
    } else if (displayTableMode.value === 'owner') {
      if (tableFilter.value === 'Available' || tableFilter.value === 'Pending' || tableFilter.value === 'Alerts') {
        rows = [];
      }
    }
  }

  if (selectedMonthKey.value) {
    rows = rows.filter(row => row.sortStart?.startsWith(selectedMonthKey.value) || row.sortEnd?.startsWith(selectedMonthKey.value));
  }

  rows.sort((left, right) => {
    const leftValue = left[sortKey.value] ?? '';
    const rightValue = right[sortKey.value] ?? '';
    if (leftValue < rightValue) return sortDirection.value === 'asc' ? -1 : 1;
    if (leftValue > rightValue) return sortDirection.value === 'asc' ? 1 : -1;
    return 0;
  });

  return rows;
});

const tableTitle = computed(() => {
  if (displayTableMode.value === 'client') return t('dashboard.clientRequestsTable');
  if (displayTableMode.value === 'intermediary') return t('dashboard.operationsTable');
  return t('dashboard.activeRentalsTable');
});

const chartTitle = computed(() => (
  chartPeriod.value === 12 ? t('dashboard.earningsChartTitle12') : t('dashboard.earningsChartTitle')
));

const statusChartTitle = computed(() => {
  if (displayTableMode.value === 'client') return t('dashboard.requestsStatusChart');
  if (displayTableMode.value === 'intermediary') return t('dashboard.operationsStatusChart');
  return t('dashboard.fleetStatusChart');
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

async function loadOwnerDashboard() {
  ownerDataReady.value = false;
  dashboard.viewMode = 'owner';
  dashboard.tableMode = 'owner';

  const ownerId = currentUserId.value;
  if (ownerId == null) {
    ownerDataReady.value = true;
    return;
  }

  await Promise.all([
    equipment.fetchMachines({ ownerId }),
    rentals.fetchRequests({ ownerId }),
    loadUsers(),
    dashboard.fetchOwnerDashboard(ownerId)
  ]);
  ownerDataReady.value = true;
}

async function loadDashboard() {
  selectedKpi.value = null;
  selectedMonthKey.value = null;
  tableFilter.value = 'all';

  if (currentUserRole.value === 'Owner' && currentUserId.value) {
    await loadOwnerDashboard();
    return;
  }
  if (currentUserRole.value === 'Client' && currentUserId.value) {
    await dashboard.fetchClientDashboard(currentUserId.value);
    return;
  }
  if (currentUserRole.value === 'Intermediary') {
    await dashboard.fetchIntermediaryDashboard();
  }
}

onMounted(loadDashboard);

function onKpiNavigate(routeName) {
  selectedKpi.value = routeName;
  router.push({ name: routeName });
}

function onSort(field) {
  if (sortKey.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    return;
  }
  sortKey.value = field;
  sortDirection.value = 'desc';
}

function onStatusFilter(filterKey) {
  tableFilter.value = tableFilter.value === filterKey ? 'all' : filterKey;
}

function onPointSelect(point) {
  selectedMonthKey.value = selectedMonthKey.value === point.filterKey ? null : point.filterKey;
}

function clearFilters() {
  tableFilter.value = 'all';
  selectedMonthKey.value = null;
  selectedKpi.value = null;
}
</script>

<template>
  <div class="dashboard-page">
    <header class="dashboard-page__header">
      <div class="dashboard-page__title-group">
        <h1 class="dashboard-page__title">
          {{ pageTitle }}
          <i class="pi pi-chevron-down dashboard-page__title-icon" />
        </h1>
        <span
            class="dashboard-page__status"
            :class="{ 'dashboard-page__status--alert': !displayFleetOperational }"
        >
          <span class="dashboard-page__status-dot" />
          {{ statusLabel }}
        </span>
      </div>

      <div class="dashboard-page__header-actions">
        <button type="button" class="dashboard-chip" @click="clearFilters">
          {{ t('dashboard.clearFilters') }}
        </button>
        <button type="button" class="dashboard-page__menu" :aria-label="t('dashboard.refresh')" @click="loadDashboard">
          <i class="pi pi-refresh" :class="{ 'pi-spin': isPageLoading }" />
        </button>
      </div>
    </header>

    <div v-if="isPageLoading" class="dashboard-page__loading">
      <i class="pi pi-spin pi-spinner" />
      <span>{{ t('dashboard.loading') }}</span>
    </div>

    <template v-else>
      <section class="dashboard-page__kpis">
        <KpiCard
            v-for="metric in displayMetrics"
            :key="metric.id"
            :title="t(metric.title)"
            :value="metric.value"
            :subtitle="metric.subtitle"
            :subtitle-params="metric.subtitleParams"
            :route-name="metric.routeName"
            :active="selectedKpi === metric.routeName"
            @navigate="onKpiNavigate"
        />
      </section>

      <section class="dashboard-panel">
        <div class="dashboard-panel__toolbar dashboard-panel__toolbar--split">
          <div>
            <h2 class="dashboard-panel__heading">{{ tableTitle }}</h2>
            <p v-if="tableFilter !== 'all' || selectedMonthKey" class="dashboard-panel__hint">
              {{ t('dashboard.filteredResults', { count: filteredRows.length }) }}
            </p>
          </div>
          <div class="dashboard-panel__filters">
            <button
                type="button"
                class="dashboard-chip"
                :class="{ 'dashboard-chip--active': tableFilter === 'all' && !selectedMonthKey }"
                @click="clearFilters"
            >
              {{ t('dashboard.filterAll') }}
            </button>
          </div>
        </div>

        <DashboardDataTable
            :rows="filteredRows"
            :mode="displayTableMode"
            :sort-key="sortKey"
            :sort-direction="sortDirection"
            @sort="onSort"
        />
      </section>

      <section class="dashboard-page__charts">
        <article class="dashboard-panel dashboard-panel--chart">
          <div class="dashboard-panel__toolbar dashboard-panel__toolbar--split">
            <h2 class="dashboard-panel__heading dashboard-panel__heading--serif">{{ chartTitle }}</h2>
            <div class="dashboard-panel__filters">
              <button
                  type="button"
                  class="dashboard-chip"
                  :class="{ 'dashboard-chip--active': chartPeriod === 6 }"
                  @click="chartPeriod = 6"
              >
                6M
              </button>
              <button
                  type="button"
                  class="dashboard-chip"
                  :class="{ 'dashboard-chip--active': chartPeriod === 12 }"
                  @click="chartPeriod = 12"
              >
                12M
              </button>
            </div>
          </div>

          <div class="dashboard-chart-card">
            <div class="dashboard-chart-card__header">
              <div>
                <p class="dashboard-chart-card__label">{{ t('dashboard.chartCardTitle') }}</p>
                <div class="dashboard-chart-card__stats">
                  <span class="dashboard-chart-card__value">{{ visibleChartTotal }}</span>
                  <span v-if="visibleChartGrowth !== null" class="dashboard-chart-card__growth">
                    {{ t('dashboard.chartGrowth', { percent: visibleChartGrowth }) }}
                  </span>
                </div>
              </div>
            </div>
            <EarningsAreaChart :points="visibleChartPoints" @point-select="onPointSelect" />
          </div>
        </article>

        <article class="dashboard-panel dashboard-panel--chart">
          <div class="dashboard-panel__toolbar">
            <h2 class="dashboard-panel__heading dashboard-panel__heading--serif">{{ statusChartTitle }}</h2>
            <p class="dashboard-panel__hint">{{ t('dashboard.statusChartHint') }}</p>
          </div>

          <div class="dashboard-chart-card">
            <StatusBarChart
                :points="displayStatusSeries"
                :active-filter="tableFilter"
                @filter="onStatusFilter"
            />
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: #f8fafc;
}

.dashboard-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.dashboard-page__header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dashboard-page__title-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.dashboard-page__title {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'Playfair Display', var(--mt-font-display);
  font-size: 34px;
  font-weight: 700;
  color: #f8fafc;
}

.dashboard-page__title-icon {
  font-size: 16px;
  color: #94a3b8;
}

.dashboard-page__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
  font-size: 12px;
}

.dashboard-page__status--alert {
  border-color: rgba(251, 113, 133, 0.35);
  color: #fecdd3;
}

.dashboard-page__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
}

.dashboard-page__status--alert .dashboard-page__status-dot {
  background: #fb7185;
}

.dashboard-page__menu {
  border: none;
  background: rgba(148, 163, 184, 0.08);
  color: #94a3b8;
  cursor: pointer;
  padding: 10px 12px;
  line-height: 1;
  border-radius: 10px;
}

.dashboard-page__loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #94a3b8;
  padding: 32px 0;
}

.dashboard-page__kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.dashboard-panel {
  background: #111827;
  border: 1px solid rgba(148, 163, 184, 0.08);
  border-radius: 16px;
  overflow: hidden;
}

.dashboard-panel__toolbar {
  padding: 18px 22px 0;
}

.dashboard-panel__toolbar--split {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.dashboard-panel__heading {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
}

.dashboard-panel__heading--serif {
  font-family: 'Playfair Display', var(--mt-font-display);
  font-size: 24px;
  font-weight: 700;
}

.dashboard-panel__hint {
  margin: 6px 0 0;
  color: #94a3b8;
  font-size: 12px;
}

.dashboard-panel__filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.dashboard-chip {
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(148, 163, 184, 0.06);
  color: #cbd5e1;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.dashboard-chip:hover,
.dashboard-chip--active {
  border-color: rgba(245, 166, 35, 0.45);
  background: rgba(245, 166, 35, 0.12);
  color: #fde68a;
}

.dashboard-page__charts {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}

.dashboard-panel--chart {
  padding-bottom: 8px;
}

.dashboard-chart-card {
  margin: 12px 22px 22px;
  padding: 18px 20px 8px;
  border-radius: 14px;
  background: #1a2234;
  border: 1px solid rgba(148, 163, 184, 0.08);
}

.dashboard-chart-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}

.dashboard-chart-card__label {
  margin: 0 0 8px;
  color: #94a3b8;
  font-size: 13px;
}

.dashboard-chart-card__stats {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.dashboard-chart-card__value {
  font-family: var(--mt-font-display);
  font-size: 30px;
  font-weight: 700;
  color: #f8fafc;
}

.dashboard-chart-card__growth {
  color: var(--mt-color-primary);
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 1100px) {
  .dashboard-page__kpis,
  .dashboard-page__charts {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard-page__title {
    font-size: 28px;
  }

  .dashboard-page__kpis {
    grid-template-columns: 1fr;
  }
}
</style>
