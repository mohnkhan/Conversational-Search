import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from '../locales';

type Translations = typeof translations.en;
type TranslationKey = keyof Translations;

interface TranslationContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [locale, setLocale] = useState<string>(() => {
        if (typeof navigator === 'undefined') {
            return 'en';
        }
        // Find the best matching locale from the user's languages
        const userLanguages = [...navigator.languages];
        const supportedLocales = Object.keys(translations);
        
        for (const lang of userLanguages) {
            if (supportedLocales.includes(lang)) {
                return lang;
            }
            const langPrefix = lang.split('-')[0];
            if (supportedLocales.includes(langPrefix)) {
                return langPrefix;
            }
        }
        return 'en'; // Default
    });

    const [currentTranslations, setCurrentTranslations] = useState<Translations>(() => {
        const supportedLocales = translations as Record<string, Translations>;
        return supportedLocales[locale] || translations.en;
    });

    useEffect(() => {
        const supportedLocales = translations as Record<string, Translations>;
        const langToLoad = supportedLocales[locale] 
            ? locale 
            : locale.split('-')[0];
            
        setCurrentTranslations(supportedLocales[langToLoad] || translations.en);
    }, [locale]);

    const t = (key: TranslationKey, substitutions?: Record<string, string>): string => {
        let translation = currentTranslations[key] || translations.en[key] || String(key);

        if (substitutions) {
            Object.entries(substitutions).forEach(([subKey, subValue]) => {
                translation = translation.replace(`{{${subKey}}}`, subValue);
            });
        }
        return translation;
    };

    const value = { locale, setLocale, t };

    return React.createElement(TranslationContext.Provider, { value }, children);
};

export const useTranslation = (): TranslationContextType => {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
};