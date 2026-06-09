<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  title: { type: String, required: true },
  value: { type: String, required: true },
  subtitle: { type: String, default: '' },
  subtitleParams: { type: Object, default: null },
  routeName: { type: String, default: null },
  active: { type: Boolean, default: false }
});

defineEmits(['navigate']);

const { t } = useI18n();
</script>

<template>
  <component
      :is="routeName ? 'button' : 'article'"
      class="kpi-card"
      :class="{ 'kpi-card--active': active, 'kpi-card--clickable': routeName }"
      :type="routeName ? 'button' : undefined"
      @click="routeName ? $emit('navigate', routeName) : undefined"
  >
    <span class="kpi-card__menu" :aria-hidden="true">
      <i class="pi pi-ellipsis-h" />
    </span>
    <p class="kpi-card__title">{{ title }}</p>
    <p class="kpi-card__value">{{ value }}</p>
    <p v-if="subtitle" class="kpi-card__subtitle">
      {{ subtitleParams ? t(subtitle, subtitleParams) : t(subtitle) }}
    </p>
  </component>
</template>

<style scoped>
.kpi-card {
  position: relative;
  display: block;
  width: 100%;
  padding: 20px 22px;
  border-radius: 14px;
  background: #1a2234;
  border: 1px solid rgba(148, 163, 184, 0.08);
  min-height: 118px;
  text-align: left;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.kpi-card--clickable {
  cursor: pointer;
}

.kpi-card--clickable:hover,
.kpi-card--active {
  transform: translateY(-2px);
  border-color: rgba(245, 166, 35, 0.35);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
}

.kpi-card__menu {
  position: absolute;
  top: 14px;
  right: 14px;
  color: #94a3b8;
  line-height: 1;
}

.kpi-card__title {
  margin: 0 0 10px;
  color: #94a3b8;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 24px;
}

.kpi-card__value {
  margin: 0;
  color: #f8fafc;
  font-family: var(--mt-font-display);
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
}

.kpi-card__subtitle {
  margin: 10px 0 0;
  color: var(--mt-color-primary);
  font-size: 13px;
  font-weight: 500;
}
</style>
