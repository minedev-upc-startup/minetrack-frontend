<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useIamStore from '../../../iam/application/iam.store.js';
import { getProfileRouteForRole, getTopNavItemsForRole } from '../../infrastructure/navigation-by-role.js';

const props = defineProps({
  /** When true, shows a hamburger control that collapses the role dashboard sidebar. */
  showNavToggle: {
    type: Boolean,
    default: false
  },
  /** Light header variant used by the catalog shell. */
  light: {
    type: Boolean,
    default: false
  }
});

defineEmits(['toggle-nav']);

const { t } = useI18n();
const router = useRouter();
const iam = useIamStore();
const { currentUserRole } = storeToRefs(iam);

const isSignedIn = computed(() => iam.isSignedIn);
const navItems = computed(() => getTopNavItemsForRole(currentUserRole.value));
const profileRoute = computed(() => getProfileRouteForRole(currentUserRole.value));

const onSignOut = () => {
  iam.signOut();
  router.push({ name: 'iam-sign-in' });
};
</script>

<template>
  <header class="topbar" :class="{ 'topbar--light': props.light }">
    <pv-button
        v-if="showNavToggle"
        v-tooltip.bottom="t('nav.toggleSidebar')"
        type="button"
        icon="pi pi-bars"
        severity="secondary"
        text
        rounded
        :aria-label="t('nav.toggleSidebar')"
        class="topbar__menu"
        @click="$emit('toggle-nav')"
    />

    <router-link :to="navItems[0] ? { name: navItems[0].routeName } : { name: 'home' }" class="topbar__brand">
      <svg class="topbar__brand-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 2L18.8 12.2L29 15L18.8 17.8L16 28L13.2 17.8L3 15L13.2 12.2L16 2Z" fill="currentColor"/>
      </svg>
      <span>{{ t('app.name') }}</span>
    </router-link>

    <nav v-if="isSignedIn && navItems.length" class="topbar__nav">
      <router-link
          v-for="item in navItems"
          :key="item.routeName"
          :to="{ name: item.routeName }"
          class="topbar__nav-link"
      >
        {{ t(item.labelKey) }}
        <i class="pi pi-chevron-down topbar__nav-chevron" />
      </router-link>
    </nav>

    <div class="topbar__spacer" />

    <div class="topbar__actions">
      <template v-if="isSignedIn">
        <button type="button" class="topbar__logout" @click="onSignOut">
          {{ t('nav.signOut') }}
        </button>
        <router-link
            v-if="profileRoute"
            :to="{ name: profileRoute }"
            class="topbar__profile"
        >
          {{ t('nav.myProfile') }}
        </router-link>
      </template>
      <template v-else>
        <router-link :to="{ name: 'iam-sign-in' }" class="topbar__logout">
          {{ t('nav.signIn') }}
        </router-link>
        <router-link :to="{ name: 'iam-sign-up' }" class="topbar__profile">
          {{ t('nav.signUp') }}
        </router-link>
      </template>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 28px;
  background: #0b1220;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  height: 64px;
  box-sizing: border-box;
}

.topbar__menu {
  flex-shrink: 0;
}

.topbar__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--mt-font-display);
  font-weight: 700;
  font-size: 20px;
  color: var(--mt-color-primary);
  text-decoration: none;
  flex-shrink: 0;
}

.topbar__brand-icon {
  width: 24px;
  height: 24px;
}

.topbar__nav {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-left: 12px;
}

.topbar__nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.15s ease;
}

.topbar__nav-link:hover,
.topbar__nav-link.router-link-active {
  color: #f8fafc;
}

.topbar__nav-chevron {
  font-size: 10px;
  opacity: 0.7;
}

.topbar__spacer {
  flex: 1;
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.topbar__logout {
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
}

.topbar__logout:hover {
  color: #e2e8f0;
}

.topbar__profile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 108px;
  height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  background: var(--mt-color-primary);
  color: #111827;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: filter 0.15s ease;
}

.topbar__profile:hover {
  filter: brightness(1.05);
  color: #111827;
}

.topbar--light {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.topbar--light .topbar__brand {
  color: #111827;
}

.topbar--light .topbar__brand-icon {
  color: var(--mt-color-primary);
}

.topbar--light .topbar__nav-link {
  color: #4b5563;
}

.topbar--light .topbar__nav-link:hover,
.topbar--light .topbar__nav-link.router-link-active {
  color: #111827;
}

.topbar--light .topbar__logout {
  color: #6b7280;
}

.topbar--light .topbar__logout:hover {
  color: #111827;
}

@media (max-width: 960px) {
  .topbar__nav {
    display: none;
  }
}
</style>
