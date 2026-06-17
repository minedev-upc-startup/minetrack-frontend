import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import es from './locales/es.json';

const LOCALE_STORAGE_KEY = 'minetrack-locale';
const SUPPORTED_LOCALES = ['en', 'es'];

function resolveInitialLocale() {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    return SUPPORTED_LOCALES.includes(saved) ? saved : 'en';
}

const i18n = createI18n({
    legacy: false,
    locale: resolveInitialLocale(),
    fallbackLocale: 'en',
    messages: { en, es }
});

export function persistLocale(locale) {
    if (!SUPPORTED_LOCALES.includes(locale)) return;
    i18n.global.locale.value = locale;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
}

document.documentElement.lang = i18n.global.locale.value;

export default i18n;
