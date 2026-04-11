import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

export type AppLanguage = 'en' | 'bn' | 'banglish';
type TranslationKey =
  | 'greeting'
  | 'totalBalance'
  | 'addExpense'
  | 'aiAssistant'
  | 'dashboard'
  | 'settings'
  | 'myAccounts';

const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  en: {
    greeting: 'Good Day',
    totalBalance: 'Total Balance',
    addExpense: 'Add Expense',
    aiAssistant: 'AI Assistant',
    dashboard: 'Dashboard',
    settings: 'Settings',
    myAccounts: 'My Accounts',
  },
  bn: {
    greeting: 'শুভদিন',
    totalBalance: 'মোট ব্যালেন্স',
    addExpense: 'খরচ যোগ করুন',
    aiAssistant: 'এআই সহকারী',
    dashboard: 'ড্যাশবোর্ড',
    settings: 'সেটিংস',
    myAccounts: 'আমার একাউন্ট',
  },
  banglish: {
    greeting: 'Shuvo Din',
    totalBalance: 'Mot Balance',
    addExpense: 'Khoroch Jog Korun',
    aiAssistant: 'AI Shohokari',
    dashboard: 'Dashboard',
    settings: 'Settings',
    myAccounts: 'Amar Accounts',
  },
};

type LanguageContextType = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  cycleLanguage: () => void;
  t: (key: TranslationKey) => string;
};

const LANGUAGE_ORDER: AppLanguage[] = ['bn', 'banglish', 'en'];
const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>('bn');

  const cycleLanguage = () => {
    const currentIndex = LANGUAGE_ORDER.indexOf(language);
    const nextLanguage = LANGUAGE_ORDER[(currentIndex + 1) % LANGUAGE_ORDER.length];
    setLanguage(nextLanguage);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      cycleLanguage,
      t: (key: TranslationKey) => translations[language][key],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}
