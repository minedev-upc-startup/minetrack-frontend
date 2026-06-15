<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  machine: { type: Object, default: null },
  visible: { type: Boolean, default: false },
  canRequest: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'request']);

const { t } = useI18n();

const displayName = computed(() => {
  if (!props.machine) return '';
  return `${props.machine.brand} ${props.machine.model}`.trim() || props.machine.name;
});

const photo = computed(() => {
  const path = props.machine?.photos?.[0];
  if (!path) return null;
  const base = import.meta.env.BASE_URL || '/';
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${normalized}`;
});

const specEntries = computed(() => {
  const specs = props.machine?.specs ?? {};
  return Object.entries(specs).map(([key, value]) => ({
    key,
    label: t(`equipment.specs.${key}`, key),
    value
  }));
});

function formatRate(value) {
  if (value == null) return '—';
  return `S/ ${Number(value).toLocaleString('es-PE')}`;
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
</script>

<template>
  <pv-drawer
      :visible="visible"
      position="right"
      class="machine-drawer"
      :header="displayName"
      @update:visible="value => { if (!value) emit('close'); }"
  >
    <div v-if="machine" class="machine-drawer__content">
      <div class="machine-drawer__media">
        <img v-if="photo" :src="photo" :alt="displayName" class="machine-drawer__img" />
        <div v-else class="machine-drawer__placeholder">
          <i :class="machineTypeIcon(machine.type)" />
          <span>{{ machine.type }}</span>
        </div>
      </div>

      <div class="machine-drawer__meta">
        <span class="machine-drawer__badge" :class="`machine-drawer__badge--${machine.status?.replace(/\s+/g, '')}`">
          {{ t(`equipment.status.${machine.status?.replace(/\s+/g, '')}`, machine.status) }}
        </span>
        <p class="machine-drawer__rate">{{ formatRate(machine.hourlyRate) }}<span>{{ t('equipment.perHour') }}</span></p>
      </div>

      <dl class="machine-drawer__facts">
        <div><dt>{{ t('equipment.colType') }}</dt><dd>{{ machine.type }}</dd></div>
        <div><dt>{{ t('equipment.colBrand') }}</dt><dd>{{ machine.brand }}</dd></div>
        <div><dt>{{ t('equipment.colModel') }}</dt><dd>{{ machine.model }}</dd></div>
        <div><dt>{{ t('equipment.colYear') }}</dt><dd>{{ machine.year ?? '—' }}</dd></div>
        <div><dt>{{ t('equipment.minHours') }}</dt><dd>{{ machine.dailyMinimumHours ?? '—' }}</dd></div>
      </dl>

      <section v-if="specEntries.length" class="machine-drawer__specs">
        <h3>{{ t('equipment.specsTitle') }}</h3>
        <dl>
          <div v-for="item in specEntries" :key="item.key">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        </dl>
      </section>

      <pv-button
          v-if="canRequest"
          :label="t('equipment.requestRental')"
          icon="pi pi-calendar-plus"
          class="machine-drawer__action"
          :disabled="machine.status !== 'Available'"
          @click="emit('request', machine)"
      />
      <p v-else-if="machine.status !== 'Available'" class="machine-drawer__hint">
        {{ t('equipment.notAvailableHint') }}
      </p>
    </div>
  </pv-drawer>
</template>

<style scoped>
.machine-drawer__content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #111827;
}

.machine-drawer__media {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background:
    radial-gradient(circle at 20% 20%, rgba(245, 166, 35, 0.12), transparent 45%),
    linear-gradient(145deg, #111827 0%, #1e293b 55%, #0f172a 100%);
  aspect-ratio: 16 / 10;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.machine-drawer__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.machine-drawer__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #94a3b8;
}

.machine-drawer__placeholder i {
  font-size: 42px;
  color: var(--mt-color-primary);
}

.machine-drawer__placeholder span {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}

.machine-drawer__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.machine-drawer__badge {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.machine-drawer__badge--Available {
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
}

.machine-drawer__badge--Rented {
  background: rgba(245, 166, 35, 0.15);
  color: #b45309;
}

.machine-drawer__badge--UnderMaintenance {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.machine-drawer__rate {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--mt-color-primary);
}

.machine-drawer__rate span {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.machine-drawer__facts,
.machine-drawer__specs dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

.machine-drawer__facts div,
.machine-drawer__specs dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.machine-drawer__facts dt,
.machine-drawer__specs dt {
  color: #6b7280;
  font-size: 13px;
}

.machine-drawer__facts dd,
.machine-drawer__specs dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}

.machine-drawer__specs h3 {
  margin: 0 0 10px;
  font-size: 15px;
}

.machine-drawer__action {
  width: 100%;
}

.machine-drawer__hint {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}
</style>
