import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

type Language = 'en' | 'hi' | 'kn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  cycleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('sw:lang');
    if (saved === 'en' || saved === 'hi' || saved === 'kn') return saved;
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('sw:lang', language);
  }, [language]);

  const cycleLanguage = () => {
    setLanguage(prev => {
      if (prev === 'en') return 'hi';
      if (prev === 'hi') return 'kn';
      return 'en';
    });
  };

  const t = (key: string): string => {
    const dict = translations[language];
    if (dict && key in dict) {
      return (dict as any)[key];
    }
    // Fallback to English
    if (translations['en'] && key in translations['en']) {
      return (translations['en'] as any)[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, cycleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
