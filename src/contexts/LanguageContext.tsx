import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { LanguageService } from '../services/language';

type LanguagePack = Record<string, string>;

interface LanguageContextValue {
  language: string;
  langPackLabel: (key: string) => string | undefined;
  switchLanguage: (lang: string) => Promise<void>;
  setLoginLanguagePack: (pack: LanguagePack, lang: string) => void;
  isLanguageLoading: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

/**
 * Maps navigator.language to a supported language code.
 * Returns "tr" if the browser language starts with "tr",
 * "en" if it starts with "en", and "en" for everything else.
 */
export function detectBrowserLanguage(): string {
  const browserLang = (typeof navigator !== 'undefined' && navigator.language) || '';
  if (browserLang.toLowerCase().startsWith('tr')) return 'tr';
  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [language, setLanguage] = useState<string>(() => detectBrowserLanguage());
  const [languagePack, setLanguagePack] = useState<LanguagePack>({});
  const [isLanguageLoading, setIsLanguageLoading] = useState<boolean>(true);
  const initialFetchDone = useRef(false);

  // On mount (no user): fetch language pack for detected browser language
  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    const detectedLang = detectBrowserLanguage();
    setIsLanguageLoading(true);
    LanguageService.getLanguagePack(detectedLang)
      .then((pack) => {
        setLanguagePack(pack);
        setLanguage(detectedLang);
      })
      .catch((err) => {
        console.error('Failed to fetch pre-login language pack:', err);
        // Continue with empty pack — fallback strings will render
      })
      .finally(() => {
        setIsLanguageLoading(false);
      });
  }, []);

  // When user is loaded (e.g. after session check on refresh), sync to their saved language
  useEffect(() => {
    if (!user?.language || user.language === language) return;

    const userLang = user.language;
    setIsLanguageLoading(true);
    LanguageService.getLanguagePack(userLang)
      .then((pack) => {
        setLanguagePack(pack);
        setLanguage(userLang);
      })
      .catch((err) => {
        console.error('Failed to fetch user language pack on session restore:', err);
      })
      .finally(() => {
        setIsLanguageLoading(false);
      });
  }, [user?.language]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Called after login to replace the pre-login pack with the one
   * from the login response.
   */
  const setLoginLanguagePack = useCallback((pack: LanguagePack, lang: string) => {
    if (pack && typeof pack === 'object') {
      setLanguagePack(pack);
      setLanguage(lang || 'en');
    } else {
      console.warn('Invalid language pack received from login response');
    }
  }, []);

  /**
   * Fetches a new language pack, updates context state, and persists
   * the preference via the API for the current user.
   */
  const switchLanguage = useCallback(async (lang: string) => {
    setIsLanguageLoading(true);
    const previousPack = languagePack;
    const previousLang = language;

    try {
      const newPack = await LanguageService.getLanguagePack(lang);
      setLanguagePack(newPack);
      setLanguage(lang);

      // Persist preference if user is logged in
      if (user?.id) {
        await LanguageService.updateUserLanguage(user.id, lang);
      }
    } catch (err) {
      console.error('Language switch failed:', err);
      // Revert to previous state on failure
      setLanguagePack(previousPack);
      setLanguage(previousLang);
      throw err;
    } finally {
      setIsLanguageLoading(false);
    }
  }, [languagePack, language, user]);

  /**
   * Returns the translated string for the given key, or undefined
   * if the key is not found in the current language pack.
   */
  const langPackLabel = useCallback(
    (key: string): string | undefined => {
      return languagePack[key] !== undefined ? languagePack[key] : undefined;
    },
    [languagePack],
  );

  const value: LanguageContextValue = {
    language,
    langPackLabel,
    switchLanguage,
    setLoginLanguagePack,
    isLanguageLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Custom hook to access the language context.
 * Must be used within a LanguageProvider.
 */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
