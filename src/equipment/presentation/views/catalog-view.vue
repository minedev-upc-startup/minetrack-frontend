<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast'; // <-- Para la alerta verde
import useEquipmentStore from '../../application/equipment.store.js';
import useIamStore from '../../../iam/application/iam.store.js'; // <-- Para saber el rol
import useRentalsStore from '../../../rentals/application/rentals.store.js';


const { t } = useI18n();
const equipment = useEquipmentStore();

const toast = useToast();
const iam = useIamStore();
const rentals = useRentalsStore();

async function requestMachine(machine) {
  const success = await rentals.submitRequest(machine.id, iam.currentUserId, machine.ownerId);

  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Solicitud enviada',
      detail: `Tu solicitud ha sido enviada al propietario.`,
      life: 4000
    });
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo enviar la solicitud.',
      life: 4000
    });
  }
}

const activeChip = ref('all');
const page = ref(1);
const rowsPerPage = 6;

/** Keys = machine id when image failed */
const imageFailed = reactive({});

const variantByMachineId = reactive({});

const chipCounts = computed(() => {
    const list = equipment.machines;
    return {
        all: list.length,
        available: list.filter(m => m.status === 'Available').length,
        rented: list.filter(m => m.status === 'Rented').length,
        maintenance: list.filter(m => m.status === 'Under Maintenance').length
    };
});

const chipFiltered = computed(() => {
    const list = equipment.machines;
    switch (activeChip.value) {
        case 'available':
            return list.filter(m => m.status === 'Available');
        case 'rented':
            return list.filter(m => m.status === 'Rented');
        case 'maintenance':
            return list.filter(m => m.status === 'Under Maintenance');
        default:
            return list;
    }
});

const registeredCount = computed(() => chipFiltered.value.length);

const totalPages = computed(() => Math.max(1, Math.ceil(chipFiltered.value.length / rowsPerPage)));

const paginatedMachines = computed(() => {
    const start = (page.value - 1) * rowsPerPage;
    return chipFiltered.value.slice(start, start + rowsPerPage);
});

const pageNumbers = computed(() =>
    Array.from({ length: totalPages.value }, (_, i) => i + 1)
);

watch([activeChip, () => chipFiltered.value.length], () => {
    page.value = 1;
});

watch(totalPages, tp => {
    if (page.value > tp) page.value = tp;
});

onMounted(() => equipment.fetchMachines());

function formatMoney(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function photoSrc(machine) {
  const p = machine.photos?.[0];
  if (!p || typeof p !== 'string') return null;
  if (p.startsWith('http')) return p;


  const base = import.meta.env.BASE_URL || '/';
  const path = p.startsWith('/') ? p.slice(1) : p;
  return `${base}${path}`;
}

function onImgError(id) {
    imageFailed[id] = true;
}

function getVariant(machineId) {
    return variantByMachineId[machineId] ?? 'green';
}

function setVariant(machineId, v) {
    variantByMachineId[machineId] = v;
}

function setChip(key) {
    activeChip.value = key;
}

function goPage(p) {
    page.value = p;
}
</script>

<template>
  <section class="catalog-view">
    <pv-toast />
    <h1 class="catalog-view__title">{{ t('equipment.catalogTitle') }}</h1>
    <p class="catalog-view__intro">{{ t('equipment.catalogIntro') }}</p>


    <div class="catalog-view__toolbar">
      <div class="catalog-view__chips" role="tablist" :aria-label="t('equipment.catalogFiltersAria')">
        <button
            type="button"
            role="tab"
            class="catalog-chip"
            :class="{ 'catalog-chip--active': activeChip === 'all' }"
            :aria-selected="activeChip === 'all'"
            @click="setChip('all')"
        >
          {{ t('equipment.chipAll', { count: chipCounts.all }) }}
        </button>
        <button
            type="button"
            role="tab"
            class="catalog-chip"
            :class="{ 'catalog-chip--active': activeChip === 'available' }"
            :aria-selected="activeChip === 'available'"
            @click="setChip('available')"
        >
          {{ t('equipment.chipAvailable', { count: chipCounts.available }) }}
        </button>
        <button
            type="button"
            role="tab"
            class="catalog-chip"
            :class="{ 'catalog-chip--active': activeChip === 'rented' }"
            :aria-selected="activeChip === 'rented'"
            @click="setChip('rented')"
        >
          {{ t('equipment.chipRented', { count: chipCounts.rented }) }}
        </button>
        <button
            type="button"
            role="tab"
            class="catalog-chip"
            :class="{ 'catalog-chip--active': activeChip === 'maintenance' }"
            :aria-selected="activeChip === 'maintenance'"
            @click="setChip('maintenance')"
        >
          {{ t('equipment.chipMaintenance', { count: chipCounts.maintenance }) }}
        </button>
      </div>
      <p class="catalog-view__count">{{ t('equipment.machinesRegistered', { count: registeredCount }) }}</p>
    </div>

    <div class="catalog-grid">
      <article
          v-for="m in paginatedMachines"
          :key="m.id"
          class="machine-card"
      >
        <div class="machine-card__media">
          <img
              v-if="photoSrc(m) && !imageFailed[m.id]"
              class="machine-card__img"
              :src="photoSrc(m)"
              :alt="m.name"
              loading="lazy"
              @error="onImgError(m.id)"
          >
          <div v-else class="machine-card__placeholder" aria-hidden="true">
            <i class="pi pi-image machine-card__placeholder-icon" />
          </div>
        </div>
        <div class="machine-card__column">
          <h2 class="machine-card__name">{{ m.name }}</h2>
          <p class="machine-card__price">
            <span class="machine-card__price-value">{{ formatMoney(m.hourlyRate) }}</span>
            <span class="machine-card__price-suffix">{{ t('equipment.perHour') }}</span>
          </p>

          <div class="machine-card__swatches" role="group" :aria-label="t('equipment.colorVariantsAria')">
            <button
                type="button"
                class="machine-card__swatch machine-card__swatch--green"
                :class="{ 'machine-card__swatch--selected': getVariant(m.id) === 'green' }"
                :aria-label="t('equipment.swatchGreen')"
                :aria-pressed="getVariant(m.id) === 'green'"
                @click="setVariant(m.id, 'green')"
            />
            <button
                type="button"
                class="machine-card__swatch machine-card__swatch--blue"
                :class="{ 'machine-card__swatch--selected': getVariant(m.id) === 'blue' }"
                :aria-label="t('equipment.swatchBlue')"
                :aria-pressed="getVariant(m.id) === 'blue'"
                @click="setVariant(m.id, 'blue')"
            />
            <button
                type="button"
                class="machine-card__swatch machine-card__swatch--slate"
                :class="{ 'machine-card__swatch--selected': getVariant(m.id) === 'slate' }"
                :aria-label="t('equipment.swatchSlate')"
                :aria-pressed="getVariant(m.id) === 'slate'"
                @click="setVariant(m.id, 'slate')"
            />
          </div>

          <pv-button
              v-if="iam.currentUserRole === 'Client'"
              label="Solicitar alquiler"
              icon="pi pi-calendar-plus"
              class="w-full mt-3"
              :disabled="m.status !== 'Available'"
              @click="requestMachine(m)"
          />

        </div>
      </article>
    </div>

    <div class="catalog-view__pagination-row">
      <nav class="catalog-pagination" :aria-label="t('equipment.paginationAria')">
        <button
            type="button"
            class="catalog-pagination__btn"
            :disabled="page <= 1"
            @click="goPage(page - 1)"
        >
          ‹
        </button>
        <button
            v-for="p in pageNumbers"
            :key="`p-${p}`"
            type="button"
            class="catalog-pagination__btn"
            :class="{ 'catalog-pagination__btn--active': p === page }"
            @click="goPage(p)"
        >
          {{ p }}
        </button>
        <button
            type="button"
            class="catalog-pagination__btn"
            :disabled="page >= totalPages"
            @click="goPage(page + 1)"
        >
          ›
        </button>
      </nav>
    </div>
  </section>
</template>

<style scoped>
.catalog-view__title {
  margin-bottom: var(--mt-space-2);
}
.catalog-view__intro {
  color: var(--mt-color-text-secondary);
  margin: 0 0 var(--mt-space-6) 0;
  max-width: 720px;
}

.catalog-view__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--mt-space-4);
  margin-bottom: var(--mt-space-6);
}

.catalog-view__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mt-space-3);
  min-width: 0;
}

.catalog-chip {
  appearance: none;
  cursor: pointer;
  font-family: var(--mt-font-body);
  font-size: 14px;
  font-weight: 500;
  padding: 10px 18px;
  border-radius: 32px;
  border: 1px solid var(--mt-color-border-strong);
  background: var(--mt-color-bg-base);
  color: var(--mt-color-text-primary);
  transition: border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.catalog-chip:hover {
  border-color: var(--mt-color-border-subtle);
  color: var(--mt-color-text-primary);
}

.catalog-chip--active {
  border-color: var(--mt-color-primary);
  color: var(--mt-color-primary);
  box-shadow: 0 0 0 1px var(--mt-color-primary);
}

.catalog-view__count {
  margin: 0;
  font-size: 14px;
  color: var(--mt-color-text-secondary);
  white-space: nowrap;
  margin-left: auto;
  text-align: right;
}

@media (max-width: 640px) {
  .catalog-view__toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .catalog-view__count {
    margin-left: 0;
  }
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: var(--mt-space-6);
  margin-bottom: var(--mt-space-8);
}

@media (min-width: 1100px) {
  .catalog-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.machine-card {
  display: flex;
  flex-direction: column;
  background: var(--mt-color-bg-elevated);
  border: 1px solid var(--mt-color-border-subtle);
  border-radius: var(--mt-radius-lg);
  overflow: hidden;
  min-height: 0;
}

.machine-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: var(--mt-color-bg-overlay);
}

.machine-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.machine-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mt-color-text-disabled);
}

.machine-card__placeholder-icon {
  font-size: 48px;
  opacity: 0.45;
}

.machine-card__column {
  display: flex;
  flex-direction: column;
  gap: var(--mt-space-3);
  padding: var(--mt-space-4);
  flex: 1;
}

.machine-card__name {
  margin: 0;
  font-family: var(--mt-font-display);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--mt-color-text-primary);
}

.machine-card__price {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--mt-space-2);
}

.machine-card__price-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--mt-color-primary);
}

.machine-card__price-suffix {
  font-size: 12px;
  color: var(--mt-color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.machine-card__swatches {
  display: flex;
  align-items: center;
  gap: var(--mt-space-3);
  margin-top: auto;
  padding-top: var(--mt-space-2);
}

.machine-card__swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
}

.machine-card__swatch:hover {
  transform: scale(1.06);
}

.machine-card__swatch--green {
  background: #10b981;
}
.machine-card__swatch--blue {
  background: #3b82f6;
}
.machine-card__swatch--slate {
  background: #64748b;
}

.machine-card__swatch--selected {
  border-color: var(--mt-color-text-primary);
  box-shadow: 0 0 0 2px var(--mt-color-bg-base), 0 0 0 4px var(--mt-color-primary);
}

.catalog-view__pagination-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.catalog-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mt-space-2);
}

.catalog-pagination__btn {
  min-width: 40px;
  height: 40px;
  padding: 0 10px;
  border-radius: var(--mt-radius-md);
  border: 1px solid var(--mt-color-border-strong);
  background: var(--mt-color-bg-elevated);
  color: var(--mt-color-text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.catalog-pagination__btn:hover:not(:disabled) {
  border-color: var(--mt-color-primary);
  color: var(--mt-color-primary);
}

.catalog-pagination__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.catalog-pagination__btn--active {
  background: var(--mt-color-primary);
  border-color: var(--mt-color-primary);
  color: var(--mt-color-text-on-primary);
  font-weight: 700;
}
</style>
