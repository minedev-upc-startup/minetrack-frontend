<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  items: {
    type: Array,
    required: true
  },
  collapsed: {
    type: Boolean,
    default: false
  }
});

const { t } = useI18n();
</script>

<template>
  <aside
      class="dashboard-sidebar"
      :class="{ 'dashboard-sidebar--collapsed': collapsed }"
  >
    <nav class="dashboard-sidebar__nav">
      <router-link
          v-for="item in items"
          :key="item.routeName"
          v-tooltip.right="collapsed ? t(item.labelKey) : null"
          :to="{ name: item.routeName }"
          class="dashboard-sidebar__link"
          active-class="dashboard-sidebar__link--active"
      >
        <i v-if="item.icon" :class="['dashboard-sidebar__icon', item.icon]" />
        <span v-show="!collapsed" class="dashboard-sidebar__label">{{ t(item.labelKey) }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<style scoped>
.dashboard-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--mt-color-bg-elevated);
  border-right: 1px solid var(--mt-color-border-subtle);
  padding: var(--mt-space-4) 0;
  box-sizing: border-box;
  transition: width 160ms ease;
}

.dashboard-sidebar--collapsed {
  width: 64px;
}

.dashboard-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: var(--mt-space-1);
}

.dashboard-sidebar__link {
  display: flex;
  align-items: center;
  gap: var(--mt-space-3);
  padding: var(--mt-space-3) var(--mt-space-4);
  margin: 0 var(--mt-space-2);
  color: var(--mt-color-text-secondary);
  text-decoration: none;
  font-size: 14px;
  border-radius: var(--mt-radius-md);
  border-left: 3px solid transparent;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}

.dashboard-sidebar--collapsed .dashboard-sidebar__link {
  justify-content: center;
  margin: 0 var(--mt-space-2);
  padding: var(--mt-space-3);
}

.dashboard-sidebar__link:hover {
  background: var(--mt-color-bg-overlay);
  color: var(--mt-color-text-primary);
}

.dashboard-sidebar__link--active {
  background: var(--mt-color-bg-overlay);
  color: var(--mt-color-primary);
  border-left-color: var(--mt-color-primary);
  font-weight: 500;
}

.dashboard-sidebar__icon {
  font-size: 18px;
  width: 22px;
  text-align: center;
  flex-shrink: 0;
}

.dashboard-sidebar__label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
