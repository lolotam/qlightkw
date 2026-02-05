import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { languages, changeLanguage, type Language } from '@/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Get initial language from localStorage
const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language');
    if (saved && saved in languages) {
      return saved as Language;
    }
  }
  return 'en';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Apply language changes
  useEffect(() => {
    const currentLang = i18n.language as Language;
    if (currentLang in languages) {
      setLanguageState(currentLang);
      document.documentElement.lang = currentLang;
      document.documentElement.dir = languages[currentLang].dir;
    }
  }, [i18n.language]);

  const setLanguage = (lang: Language) => {
    changeLanguage(lang);
    setLanguageState(lang);
  };

  const isRTL = language === 'ar';
  const dir = languages[language].dir;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
