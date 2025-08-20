
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import useProfileStore from '../store/profileStore';

interface TranslationContextType {
    t: (key: string, replacements?: { [key: string]: string | number }) => string;
    language: string;
}

// Providing a default context
export const TranslationContext = createContext<TranslationContextType>({
    t: (key) => key,
    language: 'en',
});

interface TranslationProviderProps {
    children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
    const { profile } = useProfileStore();
    const [translations, setTranslations] = useState<{ [key: string]: string }>({});
    
    // Determine language from profile or default to 'en'.
    // If onboarding, profile is null, so it correctly defaults to English until a language is chosen.
    const language = profile?.language || 'en';

    useEffect(() => {
        const fetchTranslations = async () => {
            const loadLangFile = async (langCode: string) => {
                const response = await fetch(`/locales/${langCode}.json`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch translation file: ${langCode}.json`);
                }
                return response.json();
            };

            try {
                const data = await loadLangFile(language);
                setTranslations(data);
            } catch (error) {
                console.error(`Could not load translation file for language: ${language}`, error);
                // Fallback to English if the selected language file is not found
                try {
                    const fallbackData = await loadLangFile('en');
                    setTranslations(fallbackData);
                } catch (fallbackError) {
                    console.error('Could not load fallback English translation file.', fallbackError);
                    setTranslations({}); // Prevent app crash
                }
            }
        };

        fetchTranslations();
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
        <TranslationContext.Provider value={{ t, language }}>
            {children}
        </TranslationContext.Provider>
    );
};
