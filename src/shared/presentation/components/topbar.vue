<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import LanguageSwitcher from './language-switcher.vue';
import useIamStore from '../../../iam/application/iam.store.js';

const { t } = useI18n();
const router = useRouter();
const iam = useIamStore();

const isSignedIn = computed(() => iam.isSignedIn);
const username = computed(() => iam.currentUsername);

const onSignOut = () => {
  iam.signOut();
  router.push({ name: 'iam-sign-in' });
};
</script>

<template>
  <header class="topbar">
    <router-link :to="{ name: 'home' }" class="topbar__brand">
      {{ t('app.name') }}
    </router-link>

    <div class="topbar__spacer" />

    <div class="topbar__actions">
      <LanguageSwitcher />
      <template v-if="isSignedIn">
        <span class="topbar__user">{{ username }}</span>
        <pv-button :label="t('nav.signOut')" severity="secondary" text @click="onSignOut" />
      </template>
      <template v-else>
        <router-link :to="{ name: 'iam-sign-in' }">
          <pv-button :label="t('nav.signIn')" severity="secondary" text />
        </router-link>
        <router-link :to="{ name: 'iam-sign-up' }">
          <pv-button :label="t('nav.signUp')" />
        </router-link>
      </template>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: var(--mt-space-6);
  padding: var(--mt-space-3) var(--mt-space-6);
  background: var(--mt-color-bg-elevated);
  border-bottom: 1px solid var(--mt-color-border-subtle);
  height: 56px;
  box-sizing: border-box;
}
.topbar__brand {
  font-family: var(--mt-font-display);
  font-weight: 700;
  font-size: 18px;
  color: var(--mt-color-primary);
  text-decoration: none;
}
.topbar__spacer { flex: 1; }
.topbar__actions {
  display: flex;
  align-items: center;
  gap: var(--mt-space-3);
}
.topbar__user {
  color: var(--mt-color-text-secondary);
  font-size: 13px;
}
</style>