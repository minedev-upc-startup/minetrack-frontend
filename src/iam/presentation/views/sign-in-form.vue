<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useIamStore from '../../application/iam.store.js';
import { SignInCommand } from '../../domain/sign-in.command.js';
import loginHero from '../../../assets/images/login-hero.jpg';
import googleIcon from '../../../assets/icons/google.svg';

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
  <div class="sign-in">
    <section class="sign-in__panel">
      <div class="sign-in__logo" aria-label="MineTrack">
        <svg class="sign-in__logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M16 2L18.8 12.2L29 15L18.8 17.8L16 28L13.2 17.8L3 15L13.2 12.2L16 2Z" fill="currentColor"/>
        </svg>
        <span class="sign-in__logo-text">{{ t('app.name') }}</span>
      </div>

      <div class="sign-in__content">
        <h1 class="sign-in__title">{{ t('iam.signIn.title') }}</h1>

        <form class="sign-in__form" @submit.prevent="onSubmit">
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="sign-in__input"
            :placeholder="t('iam.signIn.emailPlaceholder')"
            required
            autocomplete="email"
          />
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="sign-in__input"
            :placeholder="t('iam.signIn.passwordPlaceholder')"
            required
            autocomplete="current-password"
          />

          <div class="sign-in__divider" role="separator">
            <span>{{ t('iam.signIn.orContinueWith') }}</span>
          </div>

          <button type="button" class="sign-in__google" disabled :title="t('iam.signIn.googleComingSoon')">
            <img :src="googleIcon" alt="" class="sign-in__google-icon" />
            {{ t('iam.signIn.google') }}
          </button>

          <button type="submit" class="sign-in__btn sign-in__btn--primary">
            {{ t('iam.signIn.submit') }}
          </button>

          <router-link :to="{ name: 'iam-sign-up' }" class="sign-in__btn sign-in__btn--secondary">
            {{ t('iam.signIn.register') }}
          </router-link>
        </form>

        <ul v-if="errorMessages.length" class="sign-in__errors">
          <li v-for="(msg, i) in errorMessages" :key="i">{{ msg }}</li>
        </ul>
      </div>
    </section>

    <aside class="sign-in__hero" aria-hidden="true">
      <img :src="loginHero" alt="" class="sign-in__hero-img" />
    </aside>
  </div>
</template>

<style scoped>
.sign-in {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}

.sign-in__panel {
  display: flex;
  flex-direction: column;
  padding: 40px 56px;
  background: #ffffff;
}

.sign-in__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #c9a227;
}

.sign-in__logo-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.sign-in__logo-text {
  font-family: var(--mt-font-display);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.sign-in__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  padding: 32px 0;
}

.sign-in__title {
  margin: 0 0 28px;
  text-align: center;
  font-family: var(--mt-font-display);
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.sign-in__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sign-in__input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: none;
  border-radius: 10px;
  background: #edf0f7;
  color: #111827;
  font-family: var(--mt-font-body);
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  transition: box-shadow 0.15s ease;
}

.sign-in__input::placeholder {
  color: #9ca3af;
}

.sign-in__input:focus {
  box-shadow: 0 0 0 2px rgba(245, 166, 35, 0.35);
}

.sign-in__divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 6px 0;
  color: #9ca3af;
  font-size: 12px;
  text-transform: lowercase;
}

.sign-in__divider::before,
.sign-in__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.sign-in__google {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  color: #111827;
  font-family: var(--mt-font-body);
  font-size: 14px;
  font-weight: 500;
  cursor: not-allowed;
  opacity: 0.75;
}

.sign-in__google-icon {
  position: absolute;
  left: 18px;
  width: 20px;
  height: 20px;
}

.sign-in__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 10px;
  font-family: var(--mt-font-body);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.15s ease;
}

.sign-in__btn--primary {
  background: var(--mt-color-primary);
  color: #ffffff;
}

.sign-in__btn--primary:hover {
  filter: brightness(1.05);
}

.sign-in__btn--secondary {
  background: #121926;
  color: #ffffff;
}

.sign-in__btn--secondary:hover {
  filter: brightness(1.15);
  color: #ffffff;
}

.sign-in__errors {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  color: #dc2626;
  font-size: 13px;
  text-align: center;
}

.sign-in__hero {
  position: relative;
  overflow: hidden;
  min-height: 320px;
}

.sign-in__hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

@media (max-width: 960px) {
  .sign-in {
    grid-template-columns: 1fr;
  }

  .sign-in__hero {
    display: none;
  }

  .sign-in__panel {
    padding: 32px 24px;
  }
}
</style>
