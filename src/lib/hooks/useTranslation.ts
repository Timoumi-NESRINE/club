import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export const useTranslation = () => {
  const { t: i18nT, i18n } = useI18nextTranslation();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const t = (key: string, options?: Record<string, unknown>): string => {
    if (!isHydrated) {
      // Return a fallback during SSR to avoid hydration mismatch
      return key.split('.').pop() || key;
    }
    return i18nT(key, options) as string;
  };

  const changeLanguage = (lng: string) => {
    if (isHydrated) {
      i18n.changeLanguage(lng);
    }
  };

  const getCurrentLanguage = () => {
    if (!isHydrated) {
      return 'en'; // Default language during SSR
    }
    return i18n.language;
  };

  const getAvailableLanguages = () => {
    return ['en', 'fr'];
  };

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
    currentLanguage: isHydrated ? i18n.language : 'en',
    isReady: isHydrated && i18n.isInitialized,
  };
};
