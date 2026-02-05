import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

// Define available languages
export const languages = {
  en: { name: 'English', dir: 'ltr', flag: '🇺🇸' },
  ar: { name: 'العربية', dir: 'rtl', flag: '🇰🇼' },
} as const;

export type Language = keyof typeof languages;

// Get initial language from localStorage or default to 'en'
const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language');
    if (saved && saved in languages) {
      return saved as Language;
    }
  }
  return 'en';
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// Function to change language and update document direction
export const changeLanguage = (lang: Language) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('language', lang);
  
  // Update document language and direction
  document.documentElement.lang = lang;
  document.documentElement.dir = languages[lang].dir;
};

export default i18n;
