<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import useEquipmentStore from '../../application/equipment.store.js';
import useIamStore from '../../../iam/application/iam.store.js';
import useRentalsStore from '../../../rentals/application/rentals.store.js';
import MachineDetailDrawer from '../components/machine-detail-drawer.vue';

const { t } = useI18n();
const equipment = useEquipmentStore();
const toast = useToast();
const iam = useIamStore();
const rentals = useRentalsStore();

const page = ref(1);
const rowsPerPage = 8;
const openFilter = ref(null);
const filterType = ref('all');
const filterBrand = ref('all');
const filterRate = ref('all');
const selectedMachine = ref(null);
const drawerVisible = ref(false);
const imageFailed = reactive({});

const canRequest = computed(() => iam.currentUserRole === 'Client');

const typeOptions = computed(() => {
  const types = [...new Set(equipment.machines.map(machine => machine.type).filter(Boolean))].sort();
  return [{ label: t('equipment.filterAll'), value: 'all' }, ...types.map(type => ({ label: type, value: type }))];
});

const brandOptions = computed(() => {
  const brands = [...new Set(equipment.machines.map(machine => machine.brand).filter(Boolean))].sort();
  return [{ label: t('equipment.filterAll'), value: 'all' }, ...brands.map(brand => ({ label: brand, value: brand }))];
});

const rateOptions = computed(() => [
  { label: t('equipment.filterAll'), value: 'all' },
  { label: t('equipment.rateLow'), value: 'low' },
  { label: t('equipment.rateMid'), value: 'mid' },
  { label: t('equipment.rateHigh'), value: 'high' }
]);

const filteredMachines = computed(() => {
  return equipment.machines.filter(machine => {
    if (filterType.value !== 'all' && machine.type !== filterType.value) return false;
    if (filterBrand.value !== 'all' && machine.brand !== filterBrand.value) return false;
    if (filterRate.value === 'low' && machine.hourlyRate >= 200) return false;
    if (filterRate.value === 'mid' && (machine.hourlyRate < 200 || machine.hourlyRate > 300)) return false;
    if (filterRate.value === 'high' && machine.hourlyRate <= 300) return false;
    return true;
  });
});

const foundCount = computed(() => filteredMachines.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredMachines.value.length / rowsPerPage)));

const paginatedMachines = computed(() => {
  const start = (page.value - 1) * rowsPerPage;
  return filteredMachines.value.slice(start, start + rowsPerPage);
});

const pageNumbers = computed(() => Array.from({ length: totalPages.value }, (_, index) => index + 1));

watch([filterType, filterBrand, filterRate], () => {
  page.value = 1;
});

watch(totalPages, total => {
  if (page.value > total) page.value = total;
});

onMounted(() => {
  equipment.fetchMachines();
  document.addEventListener('click', onDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
});

function onDocumentClick(event) {
  if (!(event.target instanceof Element)) return;
  if (!event.target.closest('.catalog-filter')) {
    openFilter.value = null;
  }
}

function displayName(machine) {
  return `${machine.brand} ${machine.model}`.trim() || machine.name;
}

function formatRate(value) {
  if (value == null) return '—';
  return `S/ ${Number(value).toLocaleString('es-PE')}`;
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

function isFeatured(index) {
  return index < 2;
}

function toggleFilter(key) {
  openFilter.value = openFilter.value === key ? null : key;
}

function setFilter(key, value) {
  if (key === 'type') filterType.value = value;
  if (key === 'brand') filterBrand.value = value;
  if (key === 'rate') filterRate.value = value;
  openFilter.value = null;
}

function filterLabel(key) {
  if (key === 'type') return t('equipment.filterType');
  if (key === 'brand') return t('equipment.filterBrand');
  return t('equipment.filterRate');
}

function openMachine(machine) {
  selectedMachine.value = machine;
  drawerVisible.value = true;
}

function closeDrawer() {
  drawerVisible.value = false;
}

async function requestMachine(machine) {
  const success = await rentals.submitRequest(machine.id, iam.currentUserId, machine.ownerId);
  if (success) {
    toast.add({
      severity: 'success',
      summary: t('equipment.requestSuccessTitle'),
      detail: t('equipment.requestSuccessDetail', { name: displayName(machine) }),
      life: 4000
    });
    drawerVisible.value = false;
    return;
  }
  toast.add({
    severity: 'error',
    summary: t('equipment.requestErrorTitle'),
    detail: t('equipment.requestErrorDetail'),
    life: 4000
  });
}

function goPage(nextPage) {
  if (nextPage < 1 || nextPage > totalPages.value) return;
  page.value = nextPage;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<template>
  <section class="catalog-view">
    <pv-toast />

    <div class="catalog-view__toolbar">
      <div class="catalog-view__filters" :aria-label="t('equipment.catalogFiltersAria')">
        <div class="catalog-filter">
          <button type="button" class="catalog-filter__btn" @click.stop="toggleFilter('type')">
            {{ filterLabel('type') }}
            <i class="pi pi-chevron-down" />
          </button>
          <div v-if="openFilter === 'type'" class="catalog-filter__menu">
            <button
                v-for="option in typeOptions"
                :key="option.value"
                type="button"
                class="catalog-filter__option"
                :class="{ 'catalog-filter__option--active': filterType === option.value }"
                @click="setFilter('type', option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="catalog-filter">
          <button type="button" class="catalog-filter__btn" @click.stop="toggleFilter('brand')">
            {{ filterLabel('brand') }}
            <i class="pi pi-chevron-down" />
          </button>
          <div v-if="openFilter === 'brand'" class="catalog-filter__menu">
            <button
                v-for="option in brandOptions"
                :key="option.value"
                type="button"
                class="catalog-filter__option"
                :class="{ 'catalog-filter__option--active': filterBrand === option.value }"
                @click="setFilter('brand', option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="catalog-filter">
          <button type="button" class="catalog-filter__btn" @click.stop="toggleFilter('rate')">
            {{ filterLabel('rate') }}
            <i class="pi pi-chevron-down" />
          </button>
          <div v-if="openFilter === 'rate'" class="catalog-filter__menu">
            <button
                v-for="option in rateOptions"
                :key="option.value"
                type="button"
                class="catalog-filter__option"
                :class="{ 'catalog-filter__option--active': filterRate === option.value }"
                @click="setFilter('rate', option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <p class="catalog-view__count">{{ t('equipment.machinesFound', { count: foundCount }) }}</p>
    </div>

    <div v-if="!equipment.machinesLoaded" class="catalog-view__loading">
      <i class="pi pi-spin pi-spinner" />
      <span>{{ t('equipment.catalogLoading') }}</span>
    </div>

    <div v-else-if="!paginatedMachines.length" class="catalog-view__empty">
      {{ t('equipment.catalogEmpty') }}
    </div>

    <div v-else class="catalog-grid">
      <article
          v-for="(machine, index) in paginatedMachines"
          :key="machine.id"
          class="machine-card"
          :class="{ 'machine-card--featured': isFeatured(index) }"
          tabindex="0"
          @click="openMachine(machine)"
          @keyup.enter="openMachine(machine)"
      >
        <div class="machine-card__media">
          <div class="machine-card__media-frame">
            <img
                v-if="photoSrc(machine) && !imageFailed[machine.id]"
                class="machine-card__img"
                :src="photoSrc(machine)"
                :alt="displayName(machine)"
                loading="lazy"
                @error="onImgError(machine.id)"
            >
            <div v-else class="machine-card__placeholder" aria-hidden="true">
              <i :class="machineTypeIcon(machine.type)" />
              <span>{{ machine.type }}</span>
            </div>
          </div>
          <span class="machine-card__type">{{ machine.type }}</span>
          <span
              v-if="machine.status !== 'Available'"
              class="machine-card__status"
              :class="`machine-card__status--${machine.status?.replace(/\s+/g, '')}`"
          >
            {{ t(`equipment.status.${machine.status?.replace(/\s+/g, '')}`, machine.status) }}
          </span>
        </div>
        <div class="machine-card__body">
          <h2 class="machine-card__name">{{ displayName(machine) }}</h2>
          <p class="machine-card__price">
            <span class="machine-card__price-value">{{ formatRate(machine.hourlyRate) }}</span>
            <span class="machine-card__price-unit">{{ t('equipment.perHour') }}</span>
          </p>
        </div>
      </article>
    </div>

    <nav v-if="totalPages > 1" class="catalog-pagination" :aria-label="t('equipment.paginationAria')">
      <button
          v-for="pageNumber in pageNumbers"
          :key="pageNumber"
          type="button"
          class="catalog-pagination__page"
          :class="{ 'catalog-pagination__page--active': pageNumber === page }"
          @click="goPage(pageNumber)"
      >
        {{ pageNumber }}
      </button>
      <button
          type="button"
          class="catalog-pagination__next"
          :disabled="page >= totalPages"
          :aria-label="t('equipment.nextPage')"
          @click="goPage(page + 1)"
      >
        <i class="pi pi-chevron-right" />
      </button>
    </nav>

    <MachineDetailDrawer
        :machine="selectedMachine"
        :visible="drawerVisible"
        :can-request="canRequest"
        @close="closeDrawer"
        @request="requestMachine"
    />
  </section>
</template>

<style scoped>
.catalog-view {
  min-height: 100%;
  color: var(--mt-color-text-primary);
}

.catalog-view__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.catalog-view__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.catalog-filter {
  position: relative;
}

.catalog-filter__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  padding: 10px 16px;
  background: rgba(148, 163, 184, 0.06);
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.catalog-filter__btn:hover,
.catalog-filter__btn:focus-visible {
  border-color: rgba(245, 166, 35, 0.45);
  background: rgba(245, 166, 35, 0.12);
  color: #fde68a;
  outline: none;
}

.catalog-filter__btn i {
  font-size: 10px;
  opacity: 0.8;
}

.catalog-filter__menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 20;
  min-width: 180px;
  padding: 8px;
  border-radius: 14px;
  background: #111827;
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}

.catalog-filter__option {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  color: #cbd5e1;
  font-size: 14px;
  cursor: pointer;
}

.catalog-filter__option:hover,
.catalog-filter__option--active {
  background: rgba(245, 166, 35, 0.12);
  color: #fde68a;
}

.catalog-view__count {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
  white-space: nowrap;
}

.catalog-view__loading,
.catalog-view__empty {
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

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 36px;
}

.machine-card {
  grid-column: span 2;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  border-radius: 14px;
  background: #1a2234;
  border: 1px solid rgba(148, 163, 184, 0.08);
  overflow: hidden;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.machine-card--featured {
  grid-column: span 3;
}

.machine-card:hover,
.machine-card:focus-visible {
  transform: translateY(-3px);
  border-color: rgba(245, 166, 35, 0.35);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
  outline: none;
}

.machine-card__media {
  position: relative;
  padding: 12px 12px 0;
}

.machine-card__media-frame {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background:
    radial-gradient(circle at 20% 20%, rgba(245, 166, 35, 0.12), transparent 45%),
    linear-gradient(145deg, #111827 0%, #1e293b 55%, #0f172a 100%);
  aspect-ratio: 16 / 10;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.machine-card--featured .machine-card__media-frame {
  aspect-ratio: 16 / 9;
}

.machine-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.25s ease;
}

.machine-card:hover .machine-card__img {
  transform: scale(1.04);
}

.machine-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #94a3b8;
}

.machine-card__placeholder i {
  font-size: 38px;
  color: var(--mt-color-primary);
  opacity: 0.85;
}

.machine-card--featured .machine-card__placeholder i {
  font-size: 48px;
}

.machine-card__placeholder span {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}

.machine-card__type {
  position: absolute;
  top: 22px;
  left: 22px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: #e2e8f0;
  backdrop-filter: blur(6px);
}

.machine-card__status {
  position: absolute;
  top: 22px;
  right: 22px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.16);
  backdrop-filter: blur(6px);
}

.machine-card__status--Rented { color: #fde68a; border-color: rgba(245, 166, 35, 0.35); }
.machine-card__status--UnderMaintenance { color: #fecaca; border-color: rgba(239, 68, 68, 0.35); }

.machine-card__body {
  padding: 16px 18px 18px;
}

.machine-card__name {
  margin: 0 0 8px;
  font-family: var(--mt-font-display);
  font-size: 17px;
  font-weight: 700;
  color: #f8fafc;
}

.machine-card--featured .machine-card__name {
  font-size: 21px;
}

.machine-card__price {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.machine-card__price-value {
  color: var(--mt-color-primary);
  font-family: var(--mt-font-display);
  font-size: 15px;
  font-weight: 700;
}

.machine-card--featured .machine-card__price-value {
  font-size: 17px;
}

.machine-card__price-unit {
  color: #94a3b8;
  font-size: 13px;
}

.catalog-pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.catalog-pagination__page {
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  min-width: 28px;
  transition: color 0.15s ease;
}

.catalog-pagination__page:hover {
  color: #cbd5e1;
}

.catalog-pagination__page--active {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--mt-color-primary);
  color: var(--mt-color-text-on-primary);
  font-weight: 700;
}

.catalog-pagination__next {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(245, 166, 35, 0.35);
  border-radius: 50%;
  background: rgba(245, 166, 35, 0.12);
  color: var(--mt-color-primary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.catalog-pagination__next:hover:not(:disabled) {
  background: rgba(245, 166, 35, 0.22);
  border-color: rgba(245, 166, 35, 0.55);
}

.catalog-pagination__next:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

@media (max-width: 1100px) {
  .catalog-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .machine-card,
  .machine-card--featured {
    grid-column: span 1;
  }
}

@media (max-width: 640px) {
  .catalog-grid {
    grid-template-columns: 1fr;
  }

  .catalog-view__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .catalog-view__count {
    text-align: left;
  }
}
</style>
