<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import useEquipmentStore from '../../application/equipment.store.js';
import useIamStore from '../../../iam/application/iam.store.js';

const { t } = useI18n();
const equipment = useEquipmentStore();
const iam = useIamStore();

const statusEditId = ref(null);
const pendingStatus = ref(null);
const imageFailed = reactive({});

const statusChoices = computed(() => [
    { label: t('equipment.status.Available'), value: 'Available' },
    { label: t('equipment.status.Rented'), value: 'Rented' },
    { label: t('equipment.status.UnderMaintenance'), value: 'Under Maintenance' }
]);

const fleetCount = computed(() => equipment.machines.length);

onMounted(async () => {
    const ownerId = iam.currentUserId;
    if (ownerId == null) return;
    await equipment.fetchMachines({ ownerId });
});

function displayName(machine) {
    const label = `${machine.brand} ${machine.model}`.trim();
    return label || machine.name;
}

function photoSrc(machine) {
    const path = machine.photos?.[0];
    if (!path || typeof path !== 'string') return null;
    if (path.startsWith('http')) return path;
    const base = import.meta.env.BASE_URL || '/';
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    return `${base}${normalized}`;
}

function onImgError(id) {
    imageFailed[id] = true;
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

function formatMoney(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function statusClass(status) {
    if (status === 'Available') return 'fleet-card__badge--available';
    if (status === 'Under Maintenance') return 'fleet-card__badge--maintenance';
    if (status === 'Rented') return 'fleet-card__badge--rented';
    return 'fleet-card__badge--default';
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

function onAddMachine() {
    // UI placeholder — full create flow will be implemented later.
}
</script>

<template>
  <section class="owner-fleet">
    <header class="owner-fleet__header">
      <div class="owner-fleet__heading">
        <h1 class="owner-fleet__title">{{ t('equipment.fleetTitle') }}</h1>
        <p v-if="equipment.machinesLoaded" class="owner-fleet__count">
          {{ t('equipment.machinesRegistered', { count: fleetCount }) }}
        </p>
      </div>
      <button type="button" class="owner-fleet__add-btn" @click="onAddMachine">
        <i class="pi pi-plus" aria-hidden="true" />
        {{ t('equipment.addNewMachine') }}
      </button>
    </header>

    <div v-if="!equipment.machinesLoaded" class="owner-fleet__state">
      <i class="pi pi-spin pi-spinner" />
      <span>{{ t('equipment.fleetLoading') }}</span>
    </div>

    <div v-else-if="!equipment.machines.length" class="owner-fleet__state owner-fleet__state--empty">
      <i class="pi pi-inbox" />
      <span>{{ t('equipment.fleetEmpty') }}</span>
    </div>

    <div v-else class="owner-fleet__grid">
      <article
          v-for="machine in equipment.machines"
          :key="machine.id"
          class="fleet-card"
      >
        <div class="fleet-card__media">
          <div class="fleet-card__media-frame">
            <img
                v-if="photoSrc(machine) && !imageFailed[machine.id]"
                class="fleet-card__img"
                :src="photoSrc(machine)"
                :alt="displayName(machine)"
                loading="lazy"
                @error="onImgError(machine.id)"
            >
            <div v-else class="fleet-card__placeholder" aria-hidden="true">
              <i :class="machineTypeIcon(machine.type)" />
              <span>{{ machine.type }}</span>
            </div>
          </div>
          <span class="fleet-card__badge" :class="statusClass(machine.status)">
            {{ statusLabel(machine.status) }}
          </span>
        </div>

        <div class="fleet-card__body">
          <h2 class="fleet-card__name">{{ displayName(machine) }}</h2>
          <p class="fleet-card__subtitle">{{ machine.name }}</p>

          <ul class="fleet-card__meta">
            <li>
              <i class="pi pi-tag" aria-hidden="true" />
              <span>{{ t('equipment.colBrand') }}</span>
              <strong>{{ machine.brand || '—' }}</strong>
            </li>
            <li>
              <i class="pi pi-dollar" aria-hidden="true" />
              <span>{{ t('equipment.colHourlyRate') }}</span>
              <strong>{{ formatMoney(machine.hourlyRate) }}{{ t('equipment.perHour') }}</strong>
            </li>
          </ul>
        </div>

        <footer class="fleet-card__footer">
          <template v-if="statusEditId === machine.id">
            <pv-select
                v-model="pendingStatus"
                :options="statusChoices"
                optionLabel="label"
                optionValue="value"
                class="fleet-card__status-select"
            />
            <div class="fleet-card__footer-actions">
              <button
                  type="button"
                  class="fleet-card__action fleet-card__action--confirm"
                  :aria-label="t('equipment.saveStatus')"
                  @click="saveStatus(machine)"
              >
                <i class="pi pi-check" />
              </button>
              <button
                  type="button"
                  class="fleet-card__action"
                  :aria-label="t('equipment.cancelStatus')"
                  @click="cancelStatusEdit"
              >
                <i class="pi pi-times" />
              </button>
            </div>
          </template>
          <template v-else>
            <button
                type="button"
                class="fleet-card__action"
                :aria-label="t('equipment.editStatus')"
                @click="beginStatusEdit(machine)"
            >
              <i class="pi pi-pencil" />
              <span>{{ t('equipment.editStatus') }}</span>
            </button>
            <button
                type="button"
                class="fleet-card__action fleet-card__action--iot"
                :aria-label="t('equipment.viewIotSensors')"
            >
              <i class="pi pi-bolt" />
              <span>{{ t('equipment.viewIotSensors') }}</span>
            </button>
          </template>
        </footer>
      </article>
    </div>

    <ul v-if="equipment.errors.length" class="owner-fleet__errors">
      <li v-for="(err, i) in equipment.errors" :key="i">{{ err?.message ?? String(err) }}</li>
    </ul>
  </section>
</template>

<style scoped>
.owner-fleet {
  color: var(--mt-color-text-primary);
}

.owner-fleet__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.owner-fleet__title {
  margin: 0;
  font-family: 'Playfair Display', var(--mt-font-display);
  font-size: 34px;
  font-weight: 700;
  color: #f8fafc;
}

.owner-fleet__count {
  margin: 10px 0 0;
  color: var(--mt-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.owner-fleet__add-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: none;
  border-radius: 999px;
  padding: 14px 22px;
  background: linear-gradient(135deg, var(--mt-color-primary) 0%, var(--mt-color-primary-hover) 100%);
  color: var(--mt-color-text-on-primary);
  font-family: var(--mt-font-display);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(245, 166, 35, 0.28);
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
  white-space: nowrap;
}

.owner-fleet__add-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.04);
  box-shadow: 0 14px 30px rgba(245, 166, 35, 0.34);
}

.owner-fleet__add-btn i {
  font-size: 12px;
}

.owner-fleet__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 280px;
  color: #94a3b8;
  border-radius: 16px;
  border: 1px dashed rgba(148, 163, 184, 0.18);
  background: rgba(26, 34, 52, 0.45);
}

.owner-fleet__state--empty {
  flex-direction: column;
  gap: 12px;
}

.owner-fleet__state--empty i {
  font-size: 28px;
  color: #64748b;
}

.owner-fleet__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.fleet-card {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: #1a2234;
  border: 1px solid rgba(148, 163, 184, 0.08);
  overflow: hidden;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.fleet-card:hover {
  transform: translateY(-4px);
  border-color: rgba(245, 166, 35, 0.35);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);
}

.fleet-card__media {
  position: relative;
  padding: 14px 14px 0;
}

.fleet-card__media-frame {
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background:
    radial-gradient(circle at 18% 18%, rgba(245, 166, 35, 0.14), transparent 42%),
    linear-gradient(145deg, #111827 0%, #1e293b 55%, #0f172a 100%);
  aspect-ratio: 16 / 10;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.fleet-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.25s ease;
}

.fleet-card:hover .fleet-card__img {
  transform: scale(1.04);
}

.fleet-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.fleet-card__placeholder i {
  font-size: 36px;
  color: var(--mt-color-primary);
  opacity: 0.85;
}

.fleet-card__placeholder span {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
}

.fleet-card__badge {
  position: absolute;
  top: 24px;
  right: 24px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  backdrop-filter: blur(8px);
  border: 1px solid transparent;
}

.fleet-card__badge--available {
  background: rgba(34, 197, 94, 0.16);
  border-color: rgba(34, 197, 94, 0.35);
  color: #86efac;
}

.fleet-card__badge--rented {
  background: rgba(245, 166, 35, 0.16);
  border-color: rgba(245, 166, 35, 0.35);
  color: #fde68a;
}

.fleet-card__badge--maintenance {
  background: rgba(239, 68, 68, 0.14);
  border-color: rgba(239, 68, 68, 0.35);
  color: #fecaca;
}

.fleet-card__badge--default {
  background: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
}

.fleet-card__body {
  padding: 18px 18px 12px;
  flex: 1;
}

.fleet-card__name {
  margin: 0;
  font-family: var(--mt-font-display);
  font-size: 22px;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.2;
}

.fleet-card__subtitle {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.fleet-card__meta {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.fleet-card__meta li {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.08);
}

.fleet-card__meta i {
  color: #64748b;
  font-size: 14px;
}

.fleet-card__meta span {
  color: #94a3b8;
  font-size: 12px;
}

.fleet-card__meta strong {
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 600;
}

.fleet-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
  background: rgba(15, 23, 42, 0.35);
}

.fleet-card__footer-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.fleet-card__status-select {
  flex: 1;
  min-width: 0;
}

.fleet-card__action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  padding: 9px 12px;
  background: rgba(148, 163, 184, 0.06);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.fleet-card__action:hover {
  border-color: rgba(245, 166, 35, 0.35);
  background: rgba(245, 166, 35, 0.1);
  color: #fde68a;
}

.fleet-card__action--iot:hover {
  border-color: rgba(96, 165, 250, 0.35);
  background: rgba(96, 165, 250, 0.1);
  color: #bfdbfe;
}

.fleet-card__action--confirm {
  padding: 9px 11px;
}

.fleet-card__action--confirm:hover {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.12);
  color: #86efac;
}

.fleet-card__action span {
  display: none;
}

.owner-fleet__errors {
  color: var(--mt-color-status-maintenance);
  margin: 20px 0 0;
  padding-left: 18px;
}

@media (min-width: 640px) {
  .owner-fleet__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fleet-card__action span {
    display: inline;
  }
}

@media (min-width: 1100px) {
  .owner-fleet__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
