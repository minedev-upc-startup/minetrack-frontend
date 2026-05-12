<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  items: {
    type: Array,
    required: true
  }
});

const { t } = useI18n();
</script>

<template>
  <aside class="sidebar">
    <nav class="sidebar__nav">
      <router-link
          v-for="item in items"
          :key="item.routeName"
          :to="{ name: item.routeName }"
          class="sidebar__link"
          active-class="sidebar__link--active"
      >
        <i v-if="item.icon" :class="['sidebar__icon', item.icon]" />
        <span class="sidebar__label">{{ t(item.labelKey) }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--mt-color-bg-elevated);
  border-right: 1px solid var(--mt-color-border-subtle);
  padding: var(--mt-space-4) 0;
  box-sizing: border-box;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: var(--mt-space-1);
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: var(--mt-space-3);
  padding: var(--mt-space-3) var(--mt-space-4);
  color: var(--mt-color-text-secondary);
  text-decoration: none;
  font-size: 14px;
  border-left: 3px solid transparent;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}

.sidebar__link:hover {
  background: var(--mt-color-bg-overlay);
  color: var(--mt-color-text-primary);
}

.sidebar__link--active {
  background: var(--mt-color-bg-overlay);
  color: var(--mt-color-primary);
  border-left-color: var(--mt-color-primary);
  font-weight: 500;
}

.sidebar__icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.sidebar__label {
  flex: 1;
}
</style>