<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import useEquipmentStore from '../../application/equipment.store.js';
import useIamStore from '../../../iam/application/iam.store.js';

const { t } = useI18n();
const router = useRouter();
const equipment = useEquipmentStore();
const iam = useIamStore();

const name = ref('');
const type = ref('');
const brand = ref('');
const model = ref('');
const year = ref('');
const hourlyRate = ref('');
const dailyMinimumHours = ref('');
const photoUrl = ref('');
const specsRaw = ref('');

const submitting = ref(false);
const errors = ref({});

const machineTypes = [
  'Excavator',
  'Front Loader',
  'Dump Truck',
  'Drill',
  'Tractor',
  'Crane',
  'Bulldozer',
  'Grader'
];

function validate() {
  const e = {};
  if (!name.value.trim()) e.name = t('newMachine.errorNameRequired');
  if (!type.value) e.type = t('newMachine.errorTypeRequired');
  if (!brand.value.trim()) e.brand = t('newMachine.errorBrandRequired');
  if (!model.value.trim()) e.model = t('newMachine.errorModelRequired');
  if (!hourlyRate.value || Number(hourlyRate.value) <= 0) e.hourlyRate = t('newMachine.errorRateRequired');
  errors.value = e;
  return Object.keys(e).length === 0;
}

function parseSpecs() {
  if (!specsRaw.value.trim()) return {};
  try {
    return JSON.parse(specsRaw.value);
  } catch {
    return Object.fromEntries(
        specsRaw.value
            .split('\n')
            .map(l => l.split(':').map(s => s.trim()))
            .filter(([k, v]) => k && v)
    );
  }
}

async function submit() {
  if (!validate()) return;
  submitting.value = true;
  try {
    const resource = {
      ownerId: iam.currentUserId,
      name: name.value.trim(),
      type: type.value,
      brand: brand.value.trim(),
      model: model.value.trim(),
      year: year.value ? Number(year.value) : null,
      hourlyRate: Number(hourlyRate.value),
      dailyMinimumHours: dailyMinimumHours.value ? Number(dailyMinimumHours.value) : null,
      photos: photoUrl.value.trim() ? [photoUrl.value.trim()] : [],
      specs: parseSpecs()
    };
    await equipment.createMachine(resource);
    router.push({ name: 'owner-machines' });
  } catch {
    errors.value.general = t('newMachine.errorGeneral');
  } finally {
    submitting.value = false;
  }
}

function cancel() {
  router.push({ name: 'owner-machines' });
}
</script>

<template>
  <section class="new-machine">
    <header class="new-machine__header">
      <button type="button" class="new-machine__back" @click="cancel">
        <i class="pi pi-arrow-left" aria-hidden="true" />
        {{ t('newMachine.back') }}
      </button>
      <div>
        <h1 class="new-machine__title">{{ t('newMachine.title') }}</h1>
        <p class="new-machine__subtitle">{{ t('newMachine.subtitle') }}</p>
      </div>
    </header>

    <div class="new-machine__body">

      <fieldset class="new-machine__section">
        <legend class="new-machine__legend">
          <span class="new-machine__legend-num">01</span>
          {{ t('newMachine.sectionBasic') }}
        </legend>

        <div class="new-machine__row">
          <div class="new-machine__field" :class="{ 'new-machine__field--error': errors.name }">
            <label class="new-machine__label" for="nm-name">{{ t('newMachine.labelName') }}</label>
            <input id="nm-name" v-model="name" class="new-machine__input" type="text" :placeholder="t('newMachine.placeholderName')" />
            <span v-if="errors.name" class="new-machine__error-msg">{{ errors.name }}</span>
          </div>

          <div class="new-machine__field" :class="{ 'new-machine__field--error': errors.type }">
            <label class="new-machine__label" for="nm-type">{{ t('newMachine.labelType') }}</label>
            <select id="nm-type" v-model="type" class="new-machine__input new-machine__select">
              <option value="" disabled>{{ t('newMachine.placeholderType') }}</option>
              <option v-for="mt in machineTypes" :key="mt" :value="mt">{{ mt }}</option>
            </select>
            <span v-if="errors.type" class="new-machine__error-msg">{{ errors.type }}</span>
          </div>
        </div>

        <div class="new-machine__row">
          <div class="new-machine__field" :class="{ 'new-machine__field--error': errors.brand }">
            <label class="new-machine__label" for="nm-brand">{{ t('newMachine.labelBrand') }}</label>
            <input id="nm-brand" v-model="brand" class="new-machine__input" type="text" :placeholder="t('newMachine.placeholderBrand')" />
            <span v-if="errors.brand" class="new-machine__error-msg">{{ errors.brand }}</span>
          </div>

          <div class="new-machine__field" :class="{ 'new-machine__field--error': errors.model }">
            <label class="new-machine__label" for="nm-model">{{ t('newMachine.labelModel') }}</label>
            <input id="nm-model" v-model="model" class="new-machine__input" type="text" :placeholder="t('newMachine.placeholderModel')" />
            <span v-if="errors.model" class="new-machine__error-msg">{{ errors.model }}</span>
          </div>

          <div class="new-machine__field">
            <label class="new-machine__label" for="nm-year">{{ t('newMachine.labelYear') }}</label>
            <input id="nm-year" v-model="year" class="new-machine__input" type="number" min="1990" :max="new Date().getFullYear()" :placeholder="t('newMachine.placeholderYear')" />
          </div>
        </div>
      </fieldset>

      <fieldset class="new-machine__section">
        <legend class="new-machine__legend">
          <span class="new-machine__legend-num">02</span>
          {{ t('newMachine.sectionPricing') }}
        </legend>

        <div class="new-machine__row">
          <div class="new-machine__field" :class="{ 'new-machine__field--error': errors.hourlyRate }">
            <label class="new-machine__label" for="nm-rate">{{ t('newMachine.labelHourlyRate') }}</label>
            <div class="new-machine__input-prefix">
              <span class="new-machine__prefix">$</span>
              <input id="nm-rate" v-model="hourlyRate" class="new-machine__input new-machine__input--prefixed" type="number" min="0" step="0.01" :placeholder="t('newMachine.placeholderRate')" />
            </div>
            <span v-if="errors.hourlyRate" class="new-machine__error-msg">{{ errors.hourlyRate }}</span>
          </div>

          <div class="new-machine__field">
            <label class="new-machine__label" for="nm-minhours">{{ t('newMachine.labelMinHours') }}</label>
            <input id="nm-minhours" v-model="dailyMinimumHours" class="new-machine__input" type="number" min="1" :placeholder="t('newMachine.placeholderMinHours')" />
          </div>
        </div>
      </fieldset>

      <fieldset class="new-machine__section">
        <legend class="new-machine__legend">
          <span class="new-machine__legend-num">03</span>
          {{ t('newMachine.sectionMedia') }}
        </legend>

        <div class="new-machine__field">
          <label class="new-machine__label" for="nm-photo">{{ t('newMachine.labelPhoto') }}</label>
          <input id="nm-photo" v-model="photoUrl" class="new-machine__input" type="url" :placeholder="t('newMachine.placeholderPhoto')" />
          <span class="new-machine__hint">{{ t('newMachine.hintPhoto') }}</span>
        </div>

        <div class="new-machine__field">
          <label class="new-machine__label" for="nm-specs">{{ t('newMachine.labelSpecs') }}</label>
          <textarea id="nm-specs" v-model="specsRaw" class="new-machine__input new-machine__textarea" rows="4" :placeholder="t('newMachine.placeholderSpecs')" />
          <span class="new-machine__hint">{{ t('newMachine.hintSpecs') }}</span>
        </div>
      </fieldset>

      <p v-if="errors.general" class="new-machine__general-error">{{ errors.general }}</p>

      <div class="new-machine__actions">
        <button type="button" class="new-machine__btn new-machine__btn--cancel" :disabled="submitting" @click="cancel">
          {{ t('newMachine.cancel') }}
        </button>
        <button type="button" class="new-machine__btn new-machine__btn--submit" :disabled="submitting" @click="submit">
          <i v-if="submitting" class="pi pi-spin pi-spinner" aria-hidden="true" />
          <i v-else class="pi pi-check" aria-hidden="true" />
          {{ submitting ? t('newMachine.saving') : t('newMachine.save') }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.new-machine {
  max-width: 780px;
  margin: 0 auto;
  color: var(--mt-color-text-primary);
}

.new-machine__header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 36px;
}

.new-machine__back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding: 8px 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  background: transparent;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.new-machine__back:hover {
  border-color: rgba(245, 166, 35, 0.4);
  color: var(--mt-color-primary);
  background: rgba(245, 166, 35, 0.06);
}

.new-machine__title {
  margin: 0;
  font-family: 'Playfair Display', var(--mt-font-display);
  font-size: 32px;
  font-weight: 700;
  color: #f8fafc;
}

.new-machine__subtitle {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.new-machine__body {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.new-machine__section {
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  background: #1a2234;
  padding: 24px 24px 28px;
  margin: 0;
}

.new-machine__legend {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 20px;
}

.new-machine__legend-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(245, 166, 35, 0.15);
  border: 1px solid rgba(245, 166, 35, 0.35);
  color: var(--mt-color-primary);
  font-size: 11px;
  font-weight: 800;
  font-family: var(--mt-font-mono, 'JetBrains Mono', monospace);
}

.new-machine__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 560px) {
  .new-machine__row {
    grid-template-columns: repeat(2, 1fr);
  }
}

.new-machine__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.new-machine__label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #94a3b8;
}

.new-machine__input {
  width: 100%;
  padding: 11px 14px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.6);
  color: #e2e8f0;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.new-machine__input:focus {
  border-color: rgba(245, 166, 35, 0.5);
  box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.08);
}

.new-machine__input::placeholder {
  color: #475569;
}

.new-machine__select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
  cursor: pointer;
}

.new-machine__select option {
  background: #1a2234;
  color: #e2e8f0;
}

.new-machine__input-prefix {
  position: relative;
  display: flex;
  align-items: center;
}

.new-machine__prefix {
  position: absolute;
  left: 14px;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  pointer-events: none;
}

.new-machine__input--prefixed {
  padding-left: 28px;
}

.new-machine__textarea {
  resize: vertical;
  min-height: 96px;
  line-height: 1.5;
}

.new-machine__hint {
  font-size: 11px;
  color: #475569;
  line-height: 1.4;
}

.new-machine__error-msg {
  font-size: 12px;
  color: #f87171;
  font-weight: 500;
}

.new-machine__field--error .new-machine__input {
  border-color: rgba(248, 113, 113, 0.5);
}

.new-machine__field--error .new-machine__input:focus {
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1);
}

.new-machine__general-error {
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.25);
  color: #fca5a5;
  font-size: 13px;
  margin: 0;
}

.new-machine__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 4px;
}

.new-machine__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, filter 0.15s, background 0.15s;
  border: 1px solid transparent;
}

.new-machine__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none !important;
}

.new-machine__btn--cancel {
  background: transparent;
  border-color: rgba(148, 163, 184, 0.2);
  color: #94a3b8;
}

.new-machine__btn--cancel:hover:not(:disabled) {
  border-color: rgba(148, 163, 184, 0.4);
  background: rgba(148, 163, 184, 0.06);
  color: #cbd5e1;
}

.new-machine__btn--submit {
  background: linear-gradient(135deg, var(--mt-color-primary) 0%, var(--mt-color-primary-hover) 100%);
  color: var(--mt-color-text-on-primary);
  box-shadow: 0 8px 20px rgba(245, 166, 35, 0.25);
}

.new-machine__btn--submit:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.06);
  box-shadow: 0 12px 28px rgba(245, 166, 35, 0.32);
}
</style>