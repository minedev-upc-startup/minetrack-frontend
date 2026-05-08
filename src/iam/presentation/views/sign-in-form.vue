<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useIamStore from '../../application/iam.store.js';
import { SignInCommand } from '../../domain/sign-in.command.js';

const { t } = useI18n();
const router = useRouter();
const iam = useIamStore();

const form = ref({ email: '', password: '' });
const errorMessages = computed(() => iam.errors.map(e => t(e.message) === e.message ? e.message : t(e.message)));

const onSubmit = () => {
  const command = new SignInCommand(form.value.email, form.value.password);
  iam.signIn(command, router);
};
</script>

<template>
  <section class="iam-form">
    <h1>{{ t('iam.signIn.title') }}</h1>
    <form @submit.prevent="onSubmit">
      <div class="field">
        <label for="email">{{ t('iam.signIn.email') }}</label>
        <pv-input-text id="email" v-model="form.email" required class="w-full" />
      </div>
      <div class="field">
        <label for="password">{{ t('iam.signIn.password') }}</label>
        <pv-password id="password" v-model="form.password" :feedback="false" toggleMask class="w-full" inputClass="w-full" />
      </div>
      <pv-button type="submit" :label="t('iam.signIn.submit')" icon="pi pi-sign-in" />
    </form>

    <p class="iam-form__hint">
      {{ t('iam.signIn.noAccount') }}
      <router-link :to="{ name: 'iam-sign-up' }">{{ t('iam.signIn.createOne') }}</router-link>
    </p>

    <ul v-if="errorMessages.length" class="iam-form__errors">
      <li v-for="(msg, i) in errorMessages" :key="i">{{ msg }}</li>
    </ul>
  </section>
</template>

<style scoped>
.iam-form { max-width: 380px; margin: var(--mt-space-8) auto; }
.field { margin-bottom: var(--mt-space-4); display: flex; flex-direction: column; gap: var(--mt-space-1); }
.iam-form__hint { color: var(--mt-color-text-secondary); font-size: 13px; margin-top: var(--mt-space-4); }
.iam-form__errors { color: var(--mt-color-status-maintenance); margin-top: var(--mt-space-4); }
</style>
