import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import useProfileStore from '../store/profileStore';

interface TranslationContextType {
    t: (key: string, replacements?: { [key: string]: string | number }) => string;
    language: string;
    isTranslationsLoaded: boolean;
}

// Providing a default context
export const TranslationContext = createContext<TranslationContextType>({
    t: (key) => key,
    language: 'en',
    isTranslationsLoaded: false,
});

// Explicitly map language codes to their dynamic import functions.
// This helps bundlers like Vite correctly identify and package the locale files for production.
const localeModules: Record<string, () => Promise<any>> = {
  en: () => import('../locales/en.json'),
  hi: () => import('../locales/hi.json'),
  mr: () => import('../locales/mr.json'),
  bn: () => import('../locales/bn.json'),
  te: () => import('../locales/te.json'),
  ta: () => import('../locales/ta.json'),
};


interface TranslationProviderProps {
    children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
    const { profile } = useProfileStore();
    const [translations, setTranslations] = useState<{ [key: string]: string }>({});
    const [isTranslationsLoaded, setIsTranslationsLoaded] = useState(false);
    
    // Determine language from profile or default to 'en'.
    const language = profile?.language || 'en';

    useEffect(() => {
        const loadTranslations = async () => {
            setIsTranslationsLoaded(false);
            const loadModule = localeModules[language] || localeModules.en; // Fallback to English loader

            try {
                const module = await loadModule();
                setTranslations(module.default);
            } catch (error) {
                console.error(`Could not load translation file for language: ${language}`, error);
                // Attempt to load English as a last resort if the primary fails
                try {
                    const fallbackModule = await localeModules.en();
                    setTranslations(fallbackModule.default);
                } catch (fallbackError) {
                    console.error('Could not load fallback English translation file.', fallbackError);
                    setTranslations({}); // Prevent app crash
                }
            } finally {
                setIsTranslationsLoaded(true);
            }
        };

        loadTranslations();
    }, [language]);

    const t = useCallback((key: string, replacements?: { [key: string]: string | number }) => {
        let translation = translations[key] || key; // Fallback to key if translation not found
        if (replacements) {
            Object.keys(replacements).forEach(placeholder => {
                translation = translation.replace(`{${placeholder}}`, String(replacements[placeholder]));
            });
        }
        return translation;
    }, [translations]);

    return (
        <TranslationContext.Provider value={{ t, language, isTranslationsLoaded }}>
            {children}
        </TranslationContext.Provider>
    );
};