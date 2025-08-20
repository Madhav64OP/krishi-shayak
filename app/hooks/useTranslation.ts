
import { useContext } from 'react';
import { TranslationContext } from '../contexts/TranslationContext';

export const useTranslation = () => {
    return useContext(TranslationContext);
};
