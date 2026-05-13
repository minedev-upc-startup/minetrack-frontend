<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const profile = ref(null);

onMounted(() => {
    try {
        const raw = localStorage.getItem('currentUser');
        profile.value = raw ? JSON.parse(raw) : null;
    } catch {
        profile.value = null;
    }
});
</script>

<template>
  <section class="profile-view">
    <h1>{{ t('nav.ownerProfile') }}</h1>
    <pv-card v-if="profile" class="profile-view__card">
      <template #title>{{ profile.fullName || profile.email }}</template>
      <template #content>
        <dl class="profile-view__dl">
          <div><dt>{{ t('iam.signUp.email') }}</dt><dd>{{ profile.email }}</dd></div>
          <div><dt>{{ t('iam.signUp.phone') }}</dt><dd>{{ profile.phone || '—' }}</dd></div>
          <div><dt>{{ t('iam.signUp.company') }}</dt><dd>{{ profile.company || '—' }}</dd></div>
          <div><dt>{{ t('iam.signUp.role') }}</dt><dd>{{ profile.role }}</dd></div>
        </dl>
      </template>
    </pv-card>
    <p v-else class="profile-view__empty">{{ t('common.noProfileData') }}</p>
  </section>
</template>

<style scoped>
.profile-view h1 {
  margin-bottom: var(--mt-space-4);
}
.profile-view__card {
  max-width: 520px;
}
.profile-view__dl {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--mt-space-3);
}
.profile-view__dl dt {
  color: var(--mt-color-text-secondary);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.profile-view__dl dd {
  margin: var(--mt-space-1) 0 0 0;
  font-size: 15px;
}
.profile-view__empty {
  color: var(--mt-color-text-secondary);
}
</style>
