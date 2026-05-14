import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import lg from './lg.json';

const resources = {
  en: { translation: en },
  lg: { translation: lg },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
