import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext(null);
const KEY = '@sho-nel3b/language';

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('ar');
  useEffect(() => {
    AsyncStorage.getItem(KEY).then(value => {
      if (value === 'ar' || value === 'en') setLanguage(value);
    }).catch(() => {});
  }, []);
  const changeLanguage = useCallback(value => {
    if (value !== 'ar' && value !== 'en') return;
    setLanguage(value);
    AsyncStorage.setItem(KEY, value).catch(() => {});
  }, []);
  const t = useCallback((arabic, english) => language === 'en' ? english : arabic, [language]);
  const value = useMemo(() => ({ language, changeLanguage, t }), [language, changeLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage requires LanguageProvider');
  return context;
}