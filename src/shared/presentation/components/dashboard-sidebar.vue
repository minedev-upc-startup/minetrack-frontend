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
  width: 220px;
  flex-shrink: 0;
  background: #0b1220;
  border-right: 1px solid rgba(148, 163, 184, 0.1);
  padding: 20px 14px;
  box-sizing: border-box;
  transition: width 160ms ease;
}

.dashboard-sidebar--collapsed {
  width: 72px;
}

.dashboard-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dashboard-sidebar__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  border-radius: 12px;
  transition: background 120ms ease, color 120ms ease;
}

.dashboard-sidebar--collapsed .dashboard-sidebar__link {
  justify-content: center;
  padding: 12px;
}

.dashboard-sidebar__link:hover {
  background: rgba(148, 163, 184, 0.08);
  color: #e2e8f0;
}

.dashboard-sidebar__link--active {
  background: rgba(127, 29, 29, 0.35);
  color: #f8fafc;
  font-weight: 500;
}

.dashboard-sidebar__icon {
  font-size: 16px;
  width: 20px;
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
