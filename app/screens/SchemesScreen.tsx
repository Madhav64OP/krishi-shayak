import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ExternalLink, AlertTriangle, Landmark, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui';
import useProfileStore from '../store/profileStore';
import useContentStore from '../store/contentStore';
import { processAllSchemesWithGroq } from '../services/groqService';
import type { SchemeUpdate } from '../types';
import { useTranslation } from '../hooks/useTranslation';

const SchemesScreen = (): React.ReactNode => {
    const navigate = useNavigate();
    const profile = useProfileStore((state) => state.profile);
    const { schemeUpdates, setSchemeUpdates } = useContentStore();
    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAndProcessSchemes = useCallback(async (isRefreshing = false) => {
        if (!profile) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const allSchemes = await processAllSchemesWithGroq(profile);
            setSchemeUpdates(allSchemes);
        } catch (e) {
            setError(t('fetchSchemesError'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [profile, setSchemeUpdates, t]);

    useEffect(() => {
        if (schemeUpdates === null) {
            fetchAndProcessSchemes();
        } else {
            setIsLoading(false);
        }
    }, [fetchAndProcessSchemes, schemeUpdates]);

    const handleRefresh = () => {
        fetchAndProcessSchemes(true);
    };

    const renderContent = () => {
        if (isLoading) {
            return <SchemeSkeleton />;
        }
        if (error) {
            return (
                <Card className="text-center bg-error/10 border border-error/50">
                    <AlertTriangle className="mx-auto h-12 w-12 text-error mb-4" />
                    <h3 className="text-lg font-semibold text-text">{t('errorOccurred')}</h3>
                    <p className="text-text-secondary">{error}</p>
                </Card>
            );
        }
        if (!schemeUpdates || schemeUpdates.length === 0) {
            return (
                <Card>
                    <p className="text-center text-text-secondary">
                        {t('noSchemesFound')}
                    </p>
                </Card>
            );
        }
        return (
             <div className="space-y-4">
                {schemeUpdates.map((scheme, index) => (
                    <Card key={index} className="flex gap-4 items-start">
                        <div className="flex-shrink-0 bg-sky/20 text-sky w-12 h-12 rounded-2xl flex items-center justify-center">
                            <Landmark className="w-6 h-6" />
                        </div>
                        <div className="flex-grow min-w-0">
                            <h2 className="text-xl font-bold text-primary mb-2 break-words">{scheme.title}</h2>
                            <p className="text-text-secondary whitespace-pre-line mb-4 break-words">{scheme.summary}</p>
                            {scheme.url && scheme.url !== '#' && !scheme.url.includes('na.gov.in') && (
                                <a 
                                    href={scheme.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center text-accent font-semibold hover:underline"
                                >
                                    {t('viewSource')}
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background p-4">
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-surface-light mr-4">
                        <ChevronLeft />
                    </button>
                    <h1 className="text-2xl font-bold">{t('govtSchemesTitle')}</h1>
                </div>
                 <button onClick={handleRefresh} disabled={isLoading} className="p-2 rounded-full hover:bg-surface-light disabled:opacity-50">
                    <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </header>

            <main>
                {renderContent()}
            </main>
        </div>
    );
};

const SchemeSkeleton = () => (
    <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="animate-pulse flex gap-4 items-start">
                <div className="flex-shrink-0 bg-surface-light w-12 h-12 rounded-2xl"></div>
                <div className="flex-grow space-y-3">
                    <div className="h-6 bg-surface-light rounded w-3/4"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-surface-light rounded w-full"></div>
                        <div className="h-4 bg-surface-light rounded w-5/6"></div>
                    </div>
                     <div className="h-5 bg-surface-light rounded w-1/4"></div>
                </div>
            </Card>
        ))}
    </div>
);

export default SchemesScreen;