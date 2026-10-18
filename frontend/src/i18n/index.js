import { reactive } from 'vue'
import en from '../locales/en.json'
import am from '../locales/am.json'
import ti from '../locales/ti.json'

const messages = { en, am, ti }
const supportedLocales = ['en', 'am', 'ti']
const storedLocale = typeof localStorage !== 'undefined' ? localStorage.getItem('marketflow-locale') : null
const state = reactive({ locale: supportedLocales.includes(storedLocale) ? storedLocale : 'en' })

export function setLocale(locale) {
  if (!supportedLocales.includes(locale)) return
  state.locale = locale
  if (typeof localStorage !== 'undefined') localStorage.setItem('marketflow-locale', locale)
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
    document.documentElement.dir = 'ltr'
  }
}

export function t(key, fallback = '') {
  return messages[state.locale]?.[key] ?? messages.en[key] ?? fallback ?? key
}

export function installI18n(app) {
  setLocale(state.locale)
  app.config.globalProperties.$t = t
  app.provide('i18n', { state, messages, setLocale, t })
}

export { state as localeState, messages }
