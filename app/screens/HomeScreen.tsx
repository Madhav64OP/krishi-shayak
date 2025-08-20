
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Sun, ChevronRight, Mic, Leaf } from 'lucide-react';

import useProfileStore from '../store/profileStore';
import { getWeather } from '../services/weatherService';
import { getTipsFromGemini } from '../services/geminiService';
import { Card } from '../components/ui';
import type { WeatherData, Tip, Profile } from '../types';
import { useTranslation } from '../hooks/useTranslation';

const HomeScreen = (): React.ReactNode => {
    const profile = useProfileStore((state) => state.profile);
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [tips, setTips] = useState<Tip[]>([]);
    const [isLoadingTips, setIsLoadingTips] = useState(true);

    const fetchTips = useCallback(async (currentProfile: Profile, currentWeather: WeatherData) => {
        setIsLoadingTips(true);
        try {
            const geminiTips = await getTipsFromGemini(currentProfile, currentWeather);
            setTips(geminiTips.map((text, id) => ({ id, text })));
        } catch (error) {
            console.error("Failed to fetch tips", error);
            setTips([{ id: 0, text: t('tipsError') }]);
        } finally {
            setIsLoadingTips(false);
        }
    }, [t]);
    
    useEffect(() => {
        if (profile?.location) {
            getWeather(profile.location.lat, profile.location.lng)
                .then(data => {
                    setWeather(data);
                    fetchTips(profile, data);
                });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile]); // fetchTips is memoized

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-[#0c202d] to-background flex flex-col">
            <div className="flex-grow p-4 md:p-6 space-y-6">
                <WeatherCard profile={profile} weather={weather} />

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h2 className="text-xl font-semibold mb-4 px-2">{t('weatherTipsTitle')}</h2>
                    <div className="space-y-3">
                        {isLoadingTips ? (
                            Array.from({ length: 3 }).map((_, i) => <TipSkeleton key={i} />)
                        ) : (
                            tips.map((tip, i) => (
                                <motion.div
                                    key={tip.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                >
                                    <Card className="bg-surface-light shadow-md">{tip.text}</Card>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-3">
                    <button 
                        onClick={() => navigate('/updates')}
                        className="w-full flex justify-between items-center bg-surface-light p-4 rounded-3xl shadow-md hover:bg-surface transition-colors duration-200"
                    >
                        <span className="text-lg font-semibold">{t('newsUpdatesTitle')}</span>
                        <ChevronRight className="w-8 h-8" />
                    </button>
                    <button 
                        onClick={() => navigate('/schemes')}
                        className="w-full flex justify-between items-center bg-surface-light p-4 rounded-3xl shadow-md hover:bg-surface transition-colors duration-200"
                    >
                        <span className="text-lg font-semibold">{t('govtSchemesTitle')}</span>
                        <ChevronRight className="w-8 h-8" />
                    </button>
                    <button 
                        onClick={() => navigate('/plant-disease')}
                        className="w-full flex justify-between items-center bg-surface-light p-4 rounded-3xl shadow-md hover:bg-surface transition-colors duration-200"
                    >
                        <span className="text-lg font-semibold">{t('plantDiseaseTitle')}</span>
                        <Leaf className="w-7 h-7 text-primary" />
                    </button>
                </motion.div>
            </div>

            <AskAnythingBar />
        </div>
    );
};

const WeatherCard: React.FC<{ profile: Profile, weather: WeatherData | null }> = ({ profile, weather }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    return (
        <Card className="relative overflow-hidden bg-gray-800/50 backdrop-blur-lg border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-sky/20 via-transparent to-primary/10 opacity-50"></div>
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-2xl text-text-secondary">{t('helloUser', { name: profile.name })}</p>
                    {weather ? (
                        <h1 className="text-7xl font-bold text-white">{weather.temp}°C</h1>
                    ) : (
                        <div className="h-20 w-40 bg-gray-700/50 animate-pulse rounded-lg mt-2"></div>
                    )}
                </div>
                <div className="flex flex-col items-center space-y-2">
                    <button onClick={() => navigate('/profile')} className="w-12 h-12 flex items-center justify-center bg-sky rounded-full text-white text-xl font-bold ring-2 ring-white/50">
                        {profile.name.charAt(0).toUpperCase()}
                    </button>
                    {weather ? (
                        <>
                            <div className="w-20 h-20 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-accent rounded-full blur-xl opacity-70"></div>
                                {weather.icon}
                            </div>
                            <p className="font-semibold capitalize text-lg">{weather.condition}</p>
                        </>
                    ) : (
                         <div className="flex flex-col items-center space-y-2 mt-2">
                             <div className="w-20 h-20 bg-gray-700/50 animate-pulse rounded-full"></div>
                             <div className="h-6 w-20 bg-gray-700/50 animate-pulse rounded-md"></div>
                         </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

const TipSkeleton = () => (
    <div className="bg-surface-light p-6 rounded-4xl shadow-md animate-pulse">
        <div className="h-5 bg-gray-700/50 rounded w-3/4"></div>
    </div>
);


const AskAnythingBar = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleVoiceStart = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent focus on input which also navigates
        navigate('/chat', { state: { startVoice: true } });
    };
    
    return (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-background/70 backdrop-blur-md border-t border-white/10">
            <div className="relative">
                <input
                    type="text"
                    onFocus={() => navigate('/chat')}
                    placeholder={t('askAnythingPlaceholder')}
                    className="w-full pl-6 pr-14 py-4 text-lg bg-surface rounded-full focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-secondary"
                />
                <button 
                    onClick={handleVoiceStart}
                    aria-label="Start voice input"
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-text-secondary w-6 h-6 hover:text-primary transition-colors"
                >
                    <Mic />
                </button>
            </div>
        </div>
    );
};


export default HomeScreen;