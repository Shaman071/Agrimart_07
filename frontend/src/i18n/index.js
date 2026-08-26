// i18n Configuration
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enFarmer from './locales/en/farmer.json'
import hiFarmer from './locales/hi/farmer.json'
import knFarmer from './locales/kn/farmer.json'
import enCommon from './locales/en/common.json'
import hiCommon from './locales/hi/common.json'
import knCommon from './locales/kn/common.json'

const resources = {
  en: {
    farmer: enFarmer,
    common: enCommon,
  },
  hi: {
    farmer: hiFarmer,
    common: hiCommon,
  },
  kn: {
    farmer: knFarmer,
    common: knCommon,
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    fallbackNS: 'common',
    ns: ['common', 'farmer'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n