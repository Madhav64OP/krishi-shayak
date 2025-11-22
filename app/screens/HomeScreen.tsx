import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, ChevronRight, Newspaper, ShieldCheck, ScanLine } from 'lucide-react';

import useProfileStore from '../store/profileStore';
import useContentStore from '../store/contentStore';
import { getWeather } from '../services/weatherService';
import { getTipsFromGemini } from '../services/geminiService';
import { summarizeNewsWithGroq } from '../services/groqService';
import { Card } from '../components/ui';
import type { WeatherData, Tip, Profile, NewsUpdate } from '../types';
import { useTranslation } from '../hooks/useTranslation';

const HomeScreen = (): React.ReactNode => {
    const profile = useProfileStore((state) => state.profile);
    const { tips, setTips, newsUpdates, setNewsUpdates } = useContentStore();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isLoadingTips, setIsLoadingTips] = useState(true);
    const [isLoadingNews, setIsLoadingNews] = useState(true);

    const fetchContent = useCallback(async (currentProfile: Profile, currentWeather: WeatherData) => {
        // Fetch tips if not in store
        if (!tips) {
            setIsLoadingTips(true);
            try {
                const geminiTips = await getTipsFromGemini(currentProfile, currentWeather);
                const formattedTips = geminiTips.map((text, id) => ({ id, text }));
                setTips(formattedTips);
            } catch (error) {
                console.error("Failed to fetch tips", error);
                setTips([{ id: 0, text: t('tipsError') }]);
            } finally {
                setIsLoadingTips(false);
            }
        } else {
            setIsLoadingTips(false);
        }

        // Fetch news if not in store
        if (!newsUpdates) {
            setIsLoadingNews(true);
            try {
                const summarizedUpdates = await summarizeNewsWithGroq(currentProfile);
                setNewsUpdates(summarizedUpdates);
            } catch (e) {
                console.error("Failed to fetch news for preview", e);
                setNewsUpdates([]); // Set empty array on error to prevent re-fetching
            } finally {
                setIsLoadingNews(false);
            }
        } else {
            setIsLoadingNews(false);
        }
    }, [tips, setTips, newsUpdates, setNewsUpdates, t]);
    
    useEffect(() => {
        if (profile?.location) {
            getWeather(profile.location.lat, profile.location.lng)
                .then(data => {
                    setWeather(data);
                    fetchContent(profile, data);
                });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile]);

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
    };

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <motion.div 
                className="flex-grow p-4 md:p-6 space-y-8 pb-24"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            >
                <motion.div variants={itemVariants}>
                    <WeatherCard profile={profile} weather={weather} />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <h2 className="text-xl font-semibold mb-3 px-2 text-primary">{t('weatherTipsTitle')}</h2>
                    <div className="space-y-3">
                        {isLoadingTips ? (
                            Array.from({ length: 3 }).map((_, i) => <TipSkeleton key={i} />)
                        ) : (
                            (tips || []).map((tip) => (
                                <Card key={tip.id} className="bg-surface shadow-md p-4">{tip.text}</Card>
                            ))
                        )}
                    </div>
                </motion.div>
                
                 <motion.div variants={itemVariants} className="space-y-4">
                    <NewsPreviewCard news={newsUpdates} isLoading={isLoadingNews} />
                    <div className="grid grid-cols-2 gap-4">
                        <FeatureCard
                            title={t('govtSchemesTitle')}
                            icon={<ShieldCheck className="w-8 h-8 text-sky" />}
                            onClick={() => navigate('/schemes')}
                        />
                        <FeatureCard
                            title={t('plantDiseaseTitle')}
                            icon={<ScanLine className="w-8 h-8 text-accent" />}
                            onClick={() => navigate('/plant-disease')}
                        />
                    </div>
                </motion.div>
            </motion.div>

            <AskAnythingBar />
        </div>
    );
};

const WeatherCard: React.FC<{ profile: Profile, weather: WeatherData | null }> = ({ profile, weather }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    return (
        <Card className="relative overflow-hidden p-4">
            <div className="absolute inset-0 ai-gradient-bg opacity-10 blur-xl"></div>
            <div className="relative z-10 flex justify-between items-center gap-4">
                <div className="flex-grow">
                    <p className="text-md text-text-secondary">{t('helloUser', { name: profile.name.split(' ')[0] })}</p>
                    {weather ? (
                        <div className="flex items-center gap-3 mt-1">
                            <div className="w-12 h-12 flex items-center justify-center">
                                {weather.icon}
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white leading-none">{weather.temp}°C</h1>
                                <p className="font-semibold capitalize text-text-secondary text-sm">{weather.condition}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 mt-1">
                            <div className="w-12 h-12 bg-surface-light animate-pulse rounded-full flex-shrink-0"></div>
                            <div className="space-y-2 w-full">
                                <div className="h-9 w-24 bg-surface-light animate-pulse rounded-md"></div>
                                <div className="h-4 w-16 bg-surface-light animate-pulse rounded-md"></div>
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={() => navigate('/profile')} className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-sky/80 rounded-full text-white text-xl font-bold ring-2 ring-white/20">
                    {profile.name.charAt(0).toUpperCase()}
                </button>
            </div>
        </Card>
    );
};

const TipSkeleton = () => (
    <div className="bg-surface p-4 rounded-3xl shadow-md animate-pulse">
        <div className="h-5 bg-surface-light rounded w-3/4"></div>
    </div>
);

const NewsPreviewCard: React.FC<{ news: NewsUpdate[] | null, isLoading: boolean }> = ({ news, isLoading }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-3 animate-pulse pt-2">
                    <div className="h-5 bg-surface-light rounded w-3/4"></div>
                    <div className="h-5 bg-surface-light rounded w-full"></div>
                </div>
            );
        }
        if (!news || news.length === 0) {
            return <p className="text-text-secondary pt-2">{t('noNewsFound')}</p>;
        }
        return (
            <div className="space-y-2 pt-2">
                {news.slice(0, 2).map((item, index) => (
                    <p key={index} className="text-text-secondary truncate">
                        <span className="font-semibold text-primary/80 mr-2">●</span>{item.title}
                    </p>
                ))}
            </div>
        );
    };

    return (
        <Card isPressable onClick={() => navigate('/updates')} className="cursor-pointer border-transparent border p-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <Newspaper className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">{t('newsUpdatesTitle')}</h3>
                </div>
                <ChevronRight />
            </div>
            {renderContent()}
        </Card>
    );
};

const FeatureCard: React.FC<{ title: string, icon: React.ReactNode, onClick: () => void }> = ({ title, icon, onClick }) => {
    return (
        <Card isPressable onClick={onClick} className="cursor-pointer border-transparent border flex flex-col items-center justify-center text-center p-4 h-36">
            <div className="bg-surface-light p-3 rounded-full mb-3">
                {icon}
            </div>
            <h4 className="font-semibold">{title}</h4>
        </Card>
    );
};


const AskAnythingBar = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleVoiceStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate('/chat', { state: { startVoice: true } });
    };
    
    return (
        <div className="sticky bottom-0 left-0 right-0 p-4 pt-16 -mt-16 pointer-events-none">
            {/* Fading background container */}
            <div 
                className="absolute inset-0"
                style={{
                    maskImage: 'linear-gradient(to top, black 25%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to top, black 25%, transparent 100%)',
                }}
            >
                <div className="absolute inset-0 bg-background/90 backdrop-blur-lg"></div>
                <div className="absolute inset-0 ai-gradient-bg opacity-25"></div>
            </div>

            {/* Content container - pushed down to align with the solid part of the mask */}
            <div className="relative z-10 pointer-events-auto mt-8">
                <input
                    type="text"
                    onFocus={() => navigate('/chat')}
                    placeholder={t('askAnythingPlaceholder')}
                    className="w-full pl-6 pr-14 py-4 text-lg bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-secondary shadow-md"
                />
                <motion.button 
                    whileHover={{ scale: 1.1, color: '#34D399' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleVoiceStart}
                    aria-label="Start voice input"
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-text-secondary w-6 h-6 transition-colors"
                >
                    <Mic />
                </motion.button>
            </div>
        </div>
    );
};


export default HomeScreen;