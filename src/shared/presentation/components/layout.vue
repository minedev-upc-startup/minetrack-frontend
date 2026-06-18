<script setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import LanguageSwitcher from './language-switcher.vue';
import FooterContent from './footer-content.vue';
import useIamStore from '../../../iam/application/iam.store.js';

const { t } = useI18n();
const router = useRouter();
const iam = useIamStore();

onMounted(() => iam.restoreSession());

const isSignedIn = computed(() => iam.isSignedIn);
const username = computed(() => iam.currentUsername);

const onSignOut = () => {
  iam.signOut();
  router.push({ name: 'iam-sign-in' });
};
</script>

<template>
  <div class="app-shell">
    <header class="app-shell__topbar">
      <router-link :to="{ name: 'iam-sign-in' }" class="app-shell__brand">
        {{ t('app.name') }}
      </router-link>

      <nav class="app-shell__nav">
        <router-link :to="{ name: 'iam-sign-in' }">{{ t('nav.signIn') }}</router-link>
      </nav>

      <div class="app-shell__actions">
        <LanguageSwitcher />
        <template v-if="isSignedIn">
          <span class="app-shell__user">{{ username }}</span>
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

    <main class="app-shell__main">
      <router-view />
    </main>

    <FooterContent />
  </div>
</template>

<style scoped>
.app-shell__topbar {
  display: flex;
  align-items: center;
  gap: var(--mt-space-6);
  padding: var(--mt-space-3) var(--mt-space-6);
  background: var(--mt-color-bg-elevated);
  border-bottom: 1px solid var(--mt-color-border-subtle);
}
.app-shell__brand {
  font-family: var(--mt-font-display);
  font-weight: 700;
  font-size: 18px;
  color: var(--mt-color-primary);
}
.app-shell__nav {
  display: flex;
  gap: var(--mt-space-4);
  flex: 1;
}
.app-shell__nav a {
  color: var(--mt-color-text-secondary);
}
.app-shell__nav a.router-link-active {
  color: var(--mt-color-text-primary);
}
.app-shell__actions {
  display: flex;
  align-items: center;
  gap: var(--mt-space-3);
}
.app-shell__user {
  color: var(--mt-color-text-secondary);
  font-size: 13px;
}
</style>
