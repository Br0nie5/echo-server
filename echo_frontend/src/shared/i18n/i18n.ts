import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { english } from './locales/english'

void i18n.use(initReactI18next).init({
  resources: { en: { translation: english } },
  lng: 'en', // default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false // React already escapes
  }
})

export default i18n
