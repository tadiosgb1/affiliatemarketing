<script setup>
import { computed, inject } from 'vue'
const i18n = inject('i18n')
const locale = computed(() => i18n?.state.locale || 'en')
const changeLocale = (event) => i18n?.setLocale(event.target.value)
</script>

<template>
  <label class="language-switcher">
    <span class="language-switcher__label">{{ $t('language.label') }}</span>
    <select :value="locale" @change="changeLocale" aria-label="Select language">
      <option value="en">{{ $t('language.english') }}</option>
      <option value="am">{{ $t('language.amharic') }}</option>
      <option value="ti">{{ $t('language.tigrinya') }}</option>
    </select>
  </label>
</template>

<style scoped>
.language-switcher { display: inline-flex; align-items: center; gap: .45rem; padding: .45rem .6rem; border: 1px solid #e5e7eb; border-radius: .65rem; background: #fff; color: #374151; font-size: .8rem; box-shadow: 0 2px 8px rgb(0 0 0 / 5%); }
.language-switcher__label { white-space: nowrap; }
@media (max-width: 640px) { .language-switcher { gap: .25rem; padding: .35rem .45rem; } .language-switcher__label { display: none; } .language-switcher select { max-width: 6.5rem; } }
.language-switcher select { max-width: 8.5rem; border: 0; background: transparent; color: inherit; font: inherit; outline-offset: 2px; cursor: pointer; }
</style>
