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
          <img
              v-if="photoSrc(machine) && !imageFailed[machine.id]"
              class="machine-card__img"
              :src="photoSrc(machine)"
              :alt="displayName(machine)"
              loading="lazy"
              @error="onImgError(machine.id)"
          >
          <div v-else class="machine-card__placeholder" aria-hidden="true">
            <i class="pi pi-image" />
          </div>
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
          <p class="machine-card__price">{{ formatRate(machine.hourlyRate) }}{{ t('equipment.perHour') }}</p>
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
  color: #111827;
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
  gap: 12px;
}

.catalog-filter {
  position: relative;
}

.catalog-filter__btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: none;
  border-radius: 999px;
  padding: 12px 20px;
  background: var(--mt-color-primary);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.catalog-filter__btn:hover {
  filter: brightness(1.05);
}

.catalog-filter__btn i {
  font-size: 11px;
}

.catalog-filter__menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 20;
  min-width: 180px;
  padding: 8px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12);
}

.catalog-filter__option {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
}

.catalog-filter__option:hover,
.catalog-filter__option--active {
  background: rgba(245, 166, 35, 0.12);
  color: #92400e;
}

.catalog-view__count {
  margin: 0;
  color: #6b7280;
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
  color: #6b7280;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 22px;
  margin-bottom: 36px;
}

.machine-card {
  grid-column: span 2;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  border-radius: 0;
  transition: transform 0.15s ease;
}

.machine-card--featured {
  grid-column: span 3;
}

.machine-card:hover,
.machine-card:focus-visible {
  transform: translateY(-3px);
  outline: none;
}

.machine-card__media {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  background: #f3f4f6;
  aspect-ratio: 16 / 10;
}

.machine-card--featured .machine-card__media {
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
  transform: scale(1.03);
}

.machine-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 42px;
}

.machine-card__status {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.92);
}

.machine-card__status--Rented { color: #b45309; }
.machine-card__status--UnderMaintenance { color: #b91c1c; }

.machine-card__body {
  padding: 14px 2px 0;
}

.machine-card__name {
  margin: 0 0 4px;
  font-family: var(--mt-font-display);
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.machine-card--featured .machine-card__name {
  font-size: 22px;
}

.machine-card__price {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.catalog-pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 14px;
}

.catalog-pagination__page {
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  min-width: 28px;
}

.catalog-pagination__page--active {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--mt-color-primary);
  color: #ffffff;
  font-weight: 700;
}

.catalog-pagination__next {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: var(--mt-color-primary);
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
