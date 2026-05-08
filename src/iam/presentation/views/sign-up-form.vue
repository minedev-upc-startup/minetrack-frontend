<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useIamStore from '../../application/iam.store.js';
import { SignUpCommand } from '../../domain/sign-up.command.js';

const { t } = useI18n();
const router = useRouter();
const iam = useIamStore();

const form = ref({
  email: '',
  password: '',
  fullName: '',
  phone: '',
  company: '',
  role: 'Client'
});

const roleOptions = computed(() => [
  { label: t('iam.signUp.roleOwner'), value: 'Owner' },
  { label: t('iam.signUp.roleClient'), value: 'Client' }
]);

const errorMessages = computed(() => iam.errors.map(e => t(e.message) === e.message ? e.message : t(e.message)));

const onSubmit = () => {
  const command = new SignUpCommand({ ...form.value });
  iam.signUp(command, router);
};
</script>

<template>
  <section class="iam-form">
    <h1>{{ t('iam.signUp.title') }}</h1>
    <form @submit.prevent="onSubmit">
      <div class="field">
        <label>{{ t('iam.signUp.role') }}</label>
        <pv-select-button v-model="form.role" :options="roleOptions" optionLabel="label" optionValue="value" />
      </div>
      <div class="field">
        <label for="fullName">{{ t('iam.signUp.fullName') }}</label>
        <pv-input-text id="fullName" v-model="form.fullName" required class="w-full" />
      </div>
      <div class="field">
        <label for="email">{{ t('iam.signUp.email') }}</label>
        <pv-input-text id="email" v-model="form.email" type="email" required class="w-full" />
      </div>
      <div class="field">
        <label for="password">{{ t('iam.signUp.password') }}</label>
        <pv-password id="password" v-model="form.password" toggleMask class="w-full" inputClass="w-full" />
      </div>
      <div class="field">
        <label for="phone">{{ t('iam.signUp.phone') }}</label>
        <pv-input-text id="phone" v-model="form.phone" class="w-full" />
      </div>
      <div class="field">
        <label for="company">{{ t('iam.signUp.company') }}</label>
        <pv-input-text id="company" v-model="form.company" class="w-full" />
      </div>
      <pv-button type="submit" :label="t('iam.signUp.submit')" icon="pi pi-user-plus" />
    </form>

    <p class="iam-form__hint">
      {{ t('iam.signUp.haveAccount') }}
      <router-link :to="{ name: 'iam-sign-in' }">{{ t('iam.signUp.signInLink') }}</router-link>
    </p>

    <ul v-if="errorMessages.length" class="iam-form__errors">
      <li v-for="(msg, i) in errorMessages" :key="i">{{ msg }}</li>
    </ul>
  </section>
</template>

<style scoped>
.iam-form { max-width: 480px; margin: var(--mt-space-8) auto; }
.field { margin-bottom: var(--mt-space-4); display: flex; flex-direction: column; gap: var(--mt-space-1); }
.iam-form__hint { color: var(--mt-color-text-secondary); font-size: 13px; margin-top: var(--mt-space-4); }
.iam-form__errors { color: var(--mt-color-status-maintenance); margin-top: var(--mt-space-4); }
</style>
