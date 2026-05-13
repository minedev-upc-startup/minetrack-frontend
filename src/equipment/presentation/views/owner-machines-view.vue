<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import useEquipmentStore from '../../application/equipment.store.js';
import useIamStore from '../../../iam/application/iam.store.js';

const { t } = useI18n();
const equipment = useEquipmentStore();
const iam = useIamStore();

const statusEditId = ref(null);
const pendingStatus = ref(null);

const statusChoices = computed(() => [
    { label: t('equipment.status.Available'), value: 'Available' },
    { label: t('equipment.status.Rented'), value: 'Rented' },
    { label: t('equipment.status.UnderMaintenance'), value: 'Under Maintenance' }
]);

onMounted(async () => {
    const ownerId = iam.currentUserId;
    if (ownerId == null) return;
    await equipment.fetchMachines({ ownerId });
});

function formatMoney(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function statusSeverity(status) {
    switch (status) {
        case 'Available': return 'success';
        case 'Rented': return 'warn';
        case 'Under Maintenance': return 'danger';
        default: return 'secondary';
    }
}

function statusLabel(status) {
    if (status === 'Under Maintenance') return t('equipment.status.UnderMaintenance');
    const key = `equipment.status.${String(status).replace(/\s+/g, '')}`;
    const translated = t(key);
    return translated === key ? status : translated;
}

function beginStatusEdit(machine) {
    statusEditId.value = machine.id;
    pendingStatus.value = machine.status;
}

function cancelStatusEdit() {
    statusEditId.value = null;
    pendingStatus.value = null;
}

async function saveStatus(machine) {
    if (pendingStatus.value == null || pendingStatus.value === machine.status) {
        cancelStatusEdit();
        return;
    }
    const updated = await equipment.patchMachine(machine, { status: pendingStatus.value });
    if (updated) cancelStatusEdit();
}
</script>

<template>
  <section class="owner-machines-view">
    <h1>{{ t('equipment.fleetTitle') }}</h1>
    <p class="owner-machines-view__intro">{{ t('equipment.fleetIntro') }}</p>

    <pv-data-table
        :value="equipment.machines"
        dataKey="id"
        stripedRows
        :paginator="true"
        :rows="10"
        responsiveLayout="scroll"
    >
      <pv-column field="name" :header="t('equipment.colName')" sortable />
      <pv-column field="type" :header="t('equipment.colType')" sortable />
      <pv-column field="brand" :header="t('equipment.colBrand')" sortable />
      <pv-column field="model" :header="t('equipment.colModel')" sortable />
      <pv-column field="hourlyRate" :header="t('equipment.colHourlyRate')" sortable>
        <template #body="{ data }">
          {{ formatMoney(data.hourlyRate) }}
        </template>
      </pv-column>
      <pv-column field="status" :header="t('equipment.colStatus')" sortable>
        <template #body="{ data }">
          <template v-if="statusEditId === data.id">
            <div class="owner-machines-view__status-edit">
              <pv-select
                  v-model="pendingStatus"
                  :options="statusChoices"
                  optionLabel="label"
                  optionValue="value"
                  class="owner-machines-view__status-select"
              />
              <pv-button icon="pi pi-check" severity="success" rounded text @click="saveStatus(data)" />
              <pv-button icon="pi pi-times" severity="secondary" rounded text @click="cancelStatusEdit" />
            </div>
          </template>
          <template v-else>
            <pv-tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
            <pv-button
                v-tooltip.top="t('equipment.editStatus')"
                icon="pi pi-pencil"
                severity="secondary"
                text
                rounded
                class="owner-machines-view__edit-btn"
                @click="beginStatusEdit(data)"
            />
          </template>
        </template>
      </pv-column>
    </pv-data-table>

    <ul v-if="equipment.errors.length" class="owner-machines-view__errors">
      <li v-for="(err, i) in equipment.errors" :key="i">{{ err?.message ?? String(err) }}</li>
    </ul>
  </section>
</template>

<style scoped>
.owner-machines-view h1 {
  margin-bottom: var(--mt-space-2);
}
.owner-machines-view__intro {
  color: var(--mt-color-text-secondary);
  margin: 0 0 var(--mt-space-6) 0;
}
.owner-machines-view__status-edit {
  display: flex;
  align-items: center;
  gap: var(--mt-space-2);
  flex-wrap: wrap;
}
.owner-machines-view__status-select {
  min-width: 200px;
}
.owner-machines-view__edit-btn {
  margin-left: var(--mt-space-2);
  vertical-align: middle;
}
.owner-machines-view__errors {
  color: var(--mt-color-status-maintenance);
  margin-top: var(--mt-space-4);
}
</style>
