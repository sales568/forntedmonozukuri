import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import en from './locales/en.json';

const defaultLocale = import.meta.env.VITE_DEFAULT_LOCALE || 'es';

i18n.use(initReactI18next).init({
    resources: {
        es: { translation: es },
        en: { translation: en },
    },
    lng: defaultLocale,
    fallbackLng: 'es',
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
