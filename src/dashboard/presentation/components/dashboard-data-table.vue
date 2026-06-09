<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const props = defineProps({
  rows: { type: Array, default: () => [] },
  mode: { type: String, default: 'owner' },
  sortKey: { type: String, default: 'sortStart' },
  sortDirection: { type: String, default: 'desc' }
});

const emit = defineEmits(['sort']);

const { t } = useI18n();
const router = useRouter();

const columns = computed(() => {
  if (props.mode === 'client') {
    return [
      { key: 'machineCode', label: 'dashboard.colId', sortable: true, sortField: 'machineCode' },
      { key: 'machineName', label: 'dashboard.colMachine', sortable: true, sortField: 'machineName' },
      { key: 'status', label: 'dashboard.colStatus', sortable: true, sortField: 'status', badge: true },
      { key: 'startDate', label: 'dashboard.colStart', sortable: true, sortField: 'sortStart' },
      { key: 'endDate', label: 'dashboard.colExpectedClose', sortable: true, sortField: 'sortEnd', badge: true },
      { key: 'cost', label: 'dashboard.colCost', sortable: true, sortField: 'sortCost' }
    ];
  }

  if (props.mode === 'intermediary') {
    return [
      { key: 'machineCode', label: 'dashboard.colId', sortable: true, sortField: 'machineCode' },
      { key: 'machineName', label: 'dashboard.colMachine', sortable: true, sortField: 'machineName' },
      { key: 'clientName', label: 'dashboard.colClient', sortable: true, sortField: 'clientName' },
      { key: 'status', label: 'dashboard.colOwner', sortable: true, sortField: 'status' },
      { key: 'startDate', label: 'dashboard.colStart', sortable: true, sortField: 'sortStart' },
      { key: 'endDate', label: 'dashboard.colExpectedClose', sortable: true, sortField: 'sortEnd', badge: true }
    ];
  }

  return [
    { key: 'machineCode', label: 'dashboard.colId', sortable: true, sortField: 'machineCode' },
    { key: 'machineName', label: 'dashboard.colMachine', sortable: true, sortField: 'machineName' },
    { key: 'clientName', label: 'dashboard.colClient', sortable: true, sortField: 'clientName' },
    { key: 'startDate', label: 'dashboard.colStart', sortable: true, sortField: 'sortStart' },
    { key: 'endDate', label: 'dashboard.colExpectedClose', sortable: true, sortField: 'sortEnd', badge: true }
  ];
});

function sortIcon(field) {
  if (props.sortKey !== field) return 'pi pi-sort-alt';
  return props.sortDirection === 'asc' ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down';
}

function onHeaderClick(column) {
  if (!column.sortable) return;
  emit('sort', column.sortField);
}

function cellValue(row, key) {
  if (key === 'status' && row.statusKey) return t(row.statusKey);
  return row[key] ?? '—';
}

function onRowClick(row) {
  if (!row.linkRoute) return;
  router.push({ name: row.linkRoute, ...row.linkParams });
}
</script>

<template>
  <div class="dashboard-table-wrap">
    <table class="dashboard-table">
      <thead>
        <tr>
          <th
              v-for="column in columns"
              :key="column.key"
              :class="{ 'dashboard-table__th--sortable': column.sortable }"
              @click="onHeaderClick(column)"
          >
            {{ t(column.label) }}
            <i v-if="column.sortable" :class="sortIcon(column.sortField)" />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!rows.length">
          <td :colspan="columns.length" class="dashboard-table__empty">{{ t('dashboard.noRows') }}</td>
        </tr>
        <tr
            v-for="row in rows"
            :key="row.id"
            class="dashboard-table__row"
            tabindex="0"
            @click="onRowClick(row)"
            @keyup.enter="onRowClick(row)"
        >
          <td v-for="column in columns" :key="`${row.id}-${column.key}`">
            <span
                v-if="column.badge && column.key === 'endDate'"
                class="dashboard-table__badge"
            >
              {{ row.endDate }}
            </span>
            <span
                v-else-if="column.badge && column.key === 'status'"
                class="dashboard-table__status"
                :class="`dashboard-table__status--${row.status}`"
            >
              {{ cellValue(row, column.key) }}
            </span>
            <template v-else>
              {{ cellValue(row, column.key) }}
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.dashboard-table-wrap {
  overflow-x: auto;
  padding: 12px 22px 22px;
}

.dashboard-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
}

.dashboard-table th {
  padding: 12px 10px;
  text-align: left;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  user-select: none;
}

.dashboard-table__th--sortable {
  cursor: pointer;
}

.dashboard-table__th--sortable:hover {
  color: #e2e8f0;
}

.dashboard-table th i {
  margin-left: 4px;
  font-size: 10px;
  opacity: 0.8;
}

.dashboard-table td {
  padding: 16px 10px;
  color: #e2e8f0;
  font-size: 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.dashboard-table__row {
  cursor: pointer;
  transition: background 0.12s ease;
}

.dashboard-table__row:hover,
.dashboard-table__row:focus-visible {
  background: rgba(148, 163, 184, 0.06);
  outline: none;
}

.dashboard-table__empty {
  text-align: center;
  color: #94a3b8;
  padding: 28px 10px !important;
}

.dashboard-table__badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(245, 166, 35, 0.16);
  color: var(--mt-color-primary);
  font-size: 13px;
  font-weight: 500;
}

.dashboard-table__status {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.dashboard-table__status--Pending {
  background: rgba(245, 158, 11, 0.16);
  color: #fbbf24;
}

.dashboard-table__status--Approved {
  background: rgba(34, 197, 94, 0.16);
  color: #4ade80;
}

.dashboard-table__status--Rejected {
  background: rgba(251, 113, 133, 0.16);
  color: #fb7185;
}

.dashboard-table__status--Active {
  background: rgba(34, 197, 94, 0.16);
  color: #4ade80;
}
</style>
