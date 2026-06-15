<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import useRentalsStore from '../../application/rentals.store.js';
import useEquipmentStore from '../../../equipment/application/equipment.store.js';
import useIamStore from '../../../iam/application/iam.store.js';
import { BaseApi } from '../../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js';

const { t } = useI18n();
const rentals = useRentalsStore();
const equipment = useEquipmentStore();
const iam = useIamStore();
const { requests } = storeToRefs(rentals);
const { machines } = storeToRefs(equipment);

const loaded = ref(false);
const usersById = reactive({});

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function isEarningStatus(status) {
  const normalized = String(status).toLowerCase();
  return normalized === 'active' || normalized === 'approved';
}

function isActiveNow(request) {
  if (!isEarningStatus(request.status)) return false;
  if (!request.endDate) return true;
  const end = new Date(`${request.endDate}T23:59:59`);
  return end >= new Date();
}

function machinesByIdMap() {
  return Object.fromEntries(machines.value.map(machine => [machine.id, machine]));
}

function estimateTotal(request) {
  if (request.estimatedTotalCost != null) return Number(request.estimatedTotalCost);
  const machine = machinesByIdMap()[request.machineId];
  if (!machine?.hourlyRate || !request.startDate || !request.endDate) return 0;
  const start = new Date(`${request.startDate}T00:00:00`);
  const end = new Date(`${request.endDate}T00:00:00`);
  const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  const hours = days * (machine.dailyMinimumHours ?? 8);
  return hours * machine.hourlyRate;
}

function overlapsCurrentMonth(request) {
  if (!isEarningStatus(request.status)) return false;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const start = new Date(`${request.startDate}T00:00:00`);
  const end = new Date(`${request.endDate}T23:59:59`);
  return start <= monthEnd && end >= monthStart;
}

const approvedRentals = computed(() =>
    requests.value.filter(request => isEarningStatus(request.status))
);

const totalGrossEarnings = computed(() =>
    approvedRentals.value.reduce((sum, request) => sum + estimateTotal(request), 0)
);

const expectedThisMonth = computed(() =>
    approvedRentals.value
        .filter(request => overlapsCurrentMonth(request))
        .reduce((sum, request) => sum + estimateTotal(request), 0)
);

const activeContracts = computed(() =>
    approvedRentals.value.filter(request => isActiveNow(request)).length
);

const revenueTrend = computed(() => {
  const now = new Date();
  const points = [];

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const total = approvedRentals.value
        .filter(request => {
          const anchor = request.resolvedAt ?? request.startDate;
          if (!anchor) return false;
          const parsed = new Date(anchor);
          return parsed.getMonth() === month && parsed.getFullYear() === year;
        })
        .reduce((sum, request) => sum + estimateTotal(request), 0);

    points.push({
      label: MONTH_LABELS[month],
      value: total
    });
  }

  const maxValue = Math.max(...points.map(point => point.value), 1);
  return points.map(point => ({
    ...point,
    height: Math.max(8, Math.round((point.value / maxValue) * 100))
  }));
});

const transactionRows = computed(() =>
    [...approvedRentals.value]
        .sort((left, right) => String(right.startDate).localeCompare(String(left.startDate)))
        .map(request => {
          const machine = machinesByIdMap()[request.machineId];
          const client = usersById[request.clientId];
          const machineLabel = machine
              ? `${machine.brand} ${machine.model}`.trim() || machine.name
              : `MAC-${String(request.machineId).padStart(3, '0')}`;

          return {
            id: request.id,
            startDate: request.startDate,
            machineLabel,
            machineCode: machine ? `${(machine.brand ?? 'MAC').slice(0, 3).toUpperCase()}${String(machine.id).padStart(3, '0')}` : `MAC${String(request.machineId).padStart(3, '0')}`,
            clientName: client?.company ?? client?.fullName ?? `Client #${request.clientId}`,
            amount: estimateTotal(request),
            paymentStatus: isActiveNow(request) ? 'invoicing' : 'paid'
          };
        })
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

function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value) {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function onDownloadInvoice(row) {
  void row;
}
</script>

<template>
  <section class="earnings-page">
    <header class="earnings-page__header">
      <div>
        <h1 class="earnings-page__title">{{ t('earnings.title') }}</h1>
        <p class="earnings-page__intro">{{ t('earnings.intro') }}</p>
      </div>
      <div class="earnings-page__pulse">
        <span class="earnings-page__pulse-dot" />
        {{ t('earnings.liveData') }}
      </div>
    </header>

    <div v-if="!loaded" class="earnings-page__loading">
      <i class="pi pi-spin pi-spinner" />
      <span>{{ t('earnings.loading') }}</span>
    </div>

    <template v-else>
      <section class="earnings-kpis">
        <article class="earnings-kpi earnings-kpi--gold">
          <span class="earnings-kpi__label">{{ t('earnings.totalGross') }}</span>
          <strong class="earnings-kpi__value">{{ formatMoney(totalGrossEarnings) }}</strong>
          <span class="earnings-kpi__hint">{{ t('earnings.totalGrossHint') }}</span>
        </article>

        <article class="earnings-kpi earnings-kpi--green">
          <span class="earnings-kpi__label">{{ t('earnings.expectedMonth') }}</span>
          <strong class="earnings-kpi__value">{{ formatMoney(expectedThisMonth) }}</strong>
          <span class="earnings-kpi__hint">{{ t('earnings.expectedMonthHint') }}</span>
        </article>

        <article class="earnings-kpi earnings-kpi--blue">
          <span class="earnings-kpi__label">{{ t('earnings.activeContracts') }}</span>
          <strong class="earnings-kpi__value">{{ activeContracts }}</strong>
          <span class="earnings-kpi__hint">{{ t('earnings.activeContractsHint') }}</span>
        </article>
      </section>

      <section class="earnings-panel earnings-trend">
        <div class="earnings-panel__header">
          <h2>{{ t('earnings.revenueTrend') }}</h2>
          <span class="earnings-panel__meta">{{ t('earnings.lastSixMonths') }}</span>
        </div>

        <div class="earnings-trend__chart" role="img" :aria-label="t('earnings.revenueTrendAria')">
          <div class="earnings-trend__y-axis">
            <span>{{ formatMoney(Math.max(...revenueTrend.map(point => point.value), 0)) }}</span>
            <span>{{ formatMoney(Math.max(...revenueTrend.map(point => point.value), 0) / 2) }}</span>
            <span>USD 0</span>
          </div>

          <div class="earnings-trend__plot">
            <div class="earnings-trend__grid">
              <span v-for="line in 4" :key="line" />
            </div>

            <div class="earnings-trend__bars">
              <div
                  v-for="point in revenueTrend"
                  :key="point.label"
                  class="earnings-trend__bar-wrap"
              >
                <div
                    class="earnings-trend__bar"
                    :style="{ height: `${point.height}%` }"
                    :title="formatMoney(point.value)"
                />
                <span class="earnings-trend__bar-label">{{ point.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="earnings-panel earnings-ledger">
        <div class="earnings-panel__header">
          <h2>{{ t('earnings.transactionHistory') }}</h2>
          <span class="earnings-panel__meta">
            {{ t('earnings.transactionsCount', { count: transactionRows.length }) }}
          </span>
        </div>

        <div v-if="!transactionRows.length" class="earnings-page__empty">
          {{ t('earnings.noTransactions') }}
        </div>

        <div v-else class="earnings-ledger__table-wrap">
          <table class="earnings-ledger__table">
            <thead>
              <tr>
                <th>{{ t('earnings.colStartDate') }}</th>
                <th>{{ t('earnings.colMachine') }}</th>
                <th>{{ t('earnings.colClient') }}</th>
                <th>{{ t('earnings.colAmount') }}</th>
                <th>{{ t('earnings.colStatus') }}</th>
                <th class="earnings-ledger__action-col" aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in transactionRows" :key="row.id">
                <td>{{ formatDate(row.startDate) }}</td>
                <td>
                  <span class="earnings-ledger__machine-code">{{ row.machineCode }}</span>
                  <span class="earnings-ledger__machine-name">{{ row.machineLabel }}</span>
                </td>
                <td>{{ row.clientName }}</td>
                <td class="earnings-ledger__amount">{{ formatMoney(row.amount) }}</td>
                <td>
                  <span
                      class="earnings-ledger__badge"
                      :class="row.paymentStatus === 'paid' ? 'earnings-ledger__badge--paid' : 'earnings-ledger__badge--invoicing'"
                  >
                    {{ row.paymentStatus === 'paid' ? t('earnings.statusPaid') : t('earnings.statusInvoicing') }}
                  </span>
                </td>
                <td class="earnings-ledger__action-col">
                  <button
                      type="button"
                      class="earnings-ledger__download"
                      :aria-label="t('earnings.downloadInvoice')"
                      @click="onDownloadInvoice(row)"
                  >
                    <i class="pi pi-download" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.earnings-page {
  color: #f8fafc;
}

.earnings-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.earnings-page__title {
  margin: 0 0 8px;
  font-family: 'Playfair Display', var(--mt-font-display);
  font-size: 34px;
  font-weight: 700;
}

.earnings-page__intro {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
  max-width: 620px;
}

.earnings-page__pulse {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.24);
  color: #86efac;
  font-size: 12px;
  font-weight: 600;
}

.earnings-page__pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.8);
}

.earnings-page__loading,
.earnings-page__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 220px;
  color: #94a3b8;
  border-radius: 16px;
  border: 1px dashed rgba(148, 163, 184, 0.18);
  background: rgba(26, 34, 52, 0.45);
}

.earnings-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.earnings-kpi {
  position: relative;
  overflow: hidden;
  padding: 22px 24px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(26, 34, 52, 0.72);
  backdrop-filter: blur(8px);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.earnings-kpi::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.35;
  pointer-events: none;
}

.earnings-kpi--gold::before {
  background: radial-gradient(circle at top right, rgba(245, 166, 35, 0.35), transparent 55%);
}

.earnings-kpi--green::before {
  background: radial-gradient(circle at top right, rgba(34, 197, 94, 0.28), transparent 55%);
}

.earnings-kpi--blue::before {
  background: radial-gradient(circle at top right, rgba(96, 165, 250, 0.28), transparent 55%);
}

.earnings-kpi:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.28);
  border-color: rgba(245, 166, 35, 0.28);
}

.earnings-kpi__label {
  display: block;
  position: relative;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
}

.earnings-kpi__value {
  display: block;
  position: relative;
  margin-top: 10px;
  font-family: var(--mt-font-display);
  font-size: 34px;
  line-height: 1;
  color: #f8fafc;
}

.earnings-kpi--gold .earnings-kpi__value {
  color: #fde68a;
}

.earnings-kpi--green .earnings-kpi__value {
  color: #86efac;
}

.earnings-kpi__hint {
  display: block;
  position: relative;
  margin-top: 10px;
  color: #64748b;
  font-size: 12px;
}

.earnings-panel {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.08);
  background: #111827;
  margin-bottom: 20px;
  overflow: hidden;
}

.earnings-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.earnings-panel__header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #e2e8f0;
}

.earnings-panel__meta {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.earnings-trend__chart {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 12px;
  min-height: 280px;
  padding: 20px 22px 18px;
}

.earnings-trend__y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #64748b;
  font-size: 11px;
  padding-bottom: 28px;
}

.earnings-trend__plot {
  position: relative;
  border-left: 1px solid rgba(148, 163, 184, 0.18);
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.earnings-trend__grid {
  position: absolute;
  inset: 0 0 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

.earnings-trend__grid span {
  border-top: 1px dashed rgba(148, 163, 184, 0.1);
}

.earnings-trend__bars {
  position: relative;
  z-index: 1;
  height: 100%;
  min-height: 220px;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  align-items: end;
  padding: 0 8px 28px;
}

.earnings-trend__bar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}

.earnings-trend__bar {
  width: 100%;
  max-width: 56px;
  border-radius: 10px 10px 4px 4px;
  background: linear-gradient(180deg, rgba(245, 166, 35, 0.95) 0%, rgba(245, 166, 35, 0.18) 100%);
  box-shadow: 0 8px 24px rgba(245, 166, 35, 0.18);
  transition: transform 0.18s ease, filter 0.18s ease;
}

.earnings-trend__bar-wrap:hover .earnings-trend__bar {
  transform: translateY(-4px);
  filter: brightness(1.08);
}

.earnings-trend__bar-label {
  margin-top: 10px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
}

.earnings-ledger__table-wrap {
  overflow-x: auto;
}

.earnings-ledger__table {
  width: 100%;
  border-collapse: collapse;
}

.earnings-ledger__table th {
  padding: 14px 18px;
  text-align: left;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: rgba(15, 23, 42, 0.65);
}

.earnings-ledger__table td {
  padding: 16px 18px;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
  color: #cbd5e1;
  font-size: 14px;
  vertical-align: middle;
}

.earnings-ledger__table tbody tr {
  transition: background 0.15s ease;
}

.earnings-ledger__table tbody tr:hover {
  background: rgba(245, 166, 35, 0.06);
}

.earnings-ledger__machine-code {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.earnings-ledger__machine-name {
  display: block;
  margin-top: 2px;
  color: #f8fafc;
  font-weight: 600;
}

.earnings-ledger__amount {
  font-family: var(--mt-font-display);
  font-weight: 700;
  color: #fde68a;
}

.earnings-ledger__badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid transparent;
}

.earnings-ledger__badge--invoicing {
  background: rgba(245, 166, 35, 0.14);
  border-color: rgba(245, 166, 35, 0.32);
  color: #fde68a;
}

.earnings-ledger__badge--paid {
  background: rgba(34, 197, 94, 0.14);
  border-color: rgba(34, 197, 94, 0.32);
  color: #86efac;
}

.earnings-ledger__action-col {
  width: 56px;
  text-align: right;
}

.earnings-ledger__download {
  width: 34px;
  height: 34px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  background: rgba(148, 163, 184, 0.06);
  color: #94a3b8;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.earnings-ledger__download:hover {
  border-color: rgba(245, 166, 35, 0.35);
  background: rgba(245, 166, 35, 0.1);
  color: #fde68a;
}

@media (max-width: 960px) {
  .earnings-kpis {
    grid-template-columns: 1fr;
  }

  .earnings-trend__chart {
    grid-template-columns: 1fr;
  }

  .earnings-trend__y-axis {
    display: none;
  }
}
</style>
