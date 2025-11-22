import React, { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, ChevronLeft } from 'lucide-react';

import useProfileStore from '../../store/profileStore';
import type { Profile } from '../../types';
import { COMMON_CROPS, INDIAN_STATES, LANGUAGES } from '../../constants';
import { Button, Input, Select } from '../ui';
import { useTranslation } from '../../hooks/useTranslation';
import { VITE_WEATHER_API_KEY } from '../../config';

type OnboardingData = Omit<Profile, 'version' | 'location'> & {
    location: { city: string; lat: number | null; lng: number | null };
};

interface CitySuggestion {
    name: string;
    state?: string;
    country?: string;
    lat: number;
    lon: number;
}

const OnboardingModal = (): React.ReactNode => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [locationError, setLocationError] = useState('');
  
  // --- New States for City Autocomplete ---
  const [cityQuery, setCityQuery] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const setProfile = useProfileStore((state) => state.setProfile);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<OnboardingData>({
    defaultValues: {
      language: 'en',
      crops: [],
      state: '', 
      location: { lat: null, lng: null, city: '' },
    },
  });

  const selectedCrops = watch('crops');
  const selectedState = watch('state'); 

  // --- Click Outside Handler ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- City Fetch Logic (Corrected) ---
  const handleCitySearch = async (query: string) => {
    setCityQuery(query);
    setValue('location.city', query); 

    if (query.length < 3) {
        setCitySuggestions([]);
        return;
    }

    try {
        // FIX: Send only "City,IN" to API. Sending "City,State,IN" often fails.
        const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query},IN&limit=10&appid=${VITE_WEATHER_API_KEY}`);
        
        if (!res.ok) throw new Error('Failed to fetch cities');
        
        const data: CitySuggestion[] = await res.json();
        
        // Client-side Optimization:
        // If user selected a state in Step 2, move cities from that state to the top of the list.
        let sortedData = data;
        if (selectedState) {
            sortedData = [...data].sort((a, b) => {
                const aMatch = a.state?.toLowerCase() === selectedState.toLowerCase();
                const bMatch = b.state?.toLowerCase() === selectedState.toLowerCase();
                if (aMatch && !bMatch) return -1;
                if (!aMatch && bMatch) return 1;
                return 0;
            });
        }

        setCitySuggestions(sortedData);
        setShowSuggestions(true);
    } catch (error) {
        console.error("Error fetching cities:", error);
        setCitySuggestions([]);
    }
  };

  const selectCity = (city: CitySuggestion) => {
      setValue('location.city', city.name);
      // Automatically set coordinates from the selected city
      setValue('location.lat', city.lat);
      setValue('location.lng', city.lon);
      
      setCityQuery(city.name);
      setCitySuggestions([]);
      setShowSuggestions(false);
  };

  const handleGetLocation = () => {
    setLocationError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('location.lat', position.coords.latitude);
          setValue('location.lng', position.coords.longitude);
          setValue('location.city', 'Auto-detected'); 
          setCityQuery('Auto-detected'); 
        },
        (error) => {
          setLocationError(t('locationError', { message: error.message }));
        }
      );
    } else {
      setLocationError(t('geolocationNotSupported'));
    }
  };

  const onSubmit: SubmitHandler<OnboardingData> = (data) => {
    if (step === 4) {
      if (!data.location.lat || !data.location.lng) {
          if(!data.location.lat) {
             setLocationError(t('locationIsRequired'));
             setStep(3);
             return;
          }
      }
      
      const finalProfile: Profile = {
        ...data,
        version: 1,
        location: {
            city: data.location.city || 'Unknown',
            lat: data.location.lat!,
            lng: data.location.lng!
        }
      };
      setProfile(finalProfile);
    } else {
      setStep(step + 1);
    }
  };

  const handleCropToggle = (crop: string) => {
    const currentCrops = selectedCrops || [];
    const newCrops = currentCrops.includes(crop)
      ? currentCrops.filter(c => c !== crop)
      : [...currentCrops, crop];
    setValue('crops', newCrops);
  };
    
   const nextStep = () => setStep(s => s + 1);
   const prevStep = () => setStep(s => s - 1);
    
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
            <StepWrapper title={t('welcomeTitle')} onNext={nextStep}>
                <p className="text-center text-text-secondary mb-6">{t('onboardingLanguagePrompt')}</p>
                <div className="space-y-3">
                    {LANGUAGES.map(lang => (
                        <div key={lang.code} className="w-full">
                           <Controller
                                name="language"
                                control={control}
                                render={({ field }) => (
                                     <motion.button 
                                        onClick={() => {
                                            field.onChange(lang.code)
                                            setTimeout(() => nextStep(), 100);
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full p-3 rounded-2xl text-left transition-colors duration-200 ${field.value === lang.code ? 'bg-primary text-white' : 'bg-surface-light hover:bg-surface'}`}
                                    >
                                        {lang.name}
                                    </motion.button>
                                )}
                            />
                        </div>
                    ))}
                </div>
            </StepWrapper>
        );
      case 2:
        return (
            <StepWrapper title={t('stepBasicInfoTitle')} onBack={prevStep} onNext={handleSubmit(() => nextStep())}>
                <div className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <Input placeholder={t('namePlaceholder')} {...register('name', { required: t('nameRequired') })} className="pl-12" />
                        {errors.name && <p className="text-error text-sm mt-1">{errors.name.message}</p>}
                    </div>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <Input placeholder={t('phonePlaceholder')} type="tel" {...register('phone', { required: t('phoneRequired') })} className="pl-12" />
                         {errors.phone && <p className="text-error text-sm mt-1">{errors.phone.message}</p>}
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <Select {...register('state', { required: t('stateRequired') })} className="pl-12">
                            <option value="">{t('selectStatePlaceholder')}</option>
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        {errors.state && <p className="text-error text-sm mt-1">{errors.state.message}</p>}
                    </div>
                </div>
            </StepWrapper>
        );
      case 3:
        return (
            <StepWrapper title={t('stepLocationTitle')} onBack={prevStep} onNext={handleSubmit(() => nextStep())}>
                <p className="text-center text-text-secondary mb-4">{t('locationPrompt')}</p>
                
                <Button onClick={handleGetLocation} type="button" className="w-full mb-6 bg-sky/80 hover:bg-sky">
                    {t('autoDetectLocationButton')}
                </Button>
                
                <div className="relative mb-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-surface-light" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-text-secondary">Or enter manually</span>
                    </div>
                </div>

                <div className="relative" ref={suggestionsRef}>
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary z-10" />
                    <Input 
                        placeholder={t('cityPlaceholder')} 
                        value={cityQuery}
                        onChange={(e) => handleCitySearch(e.target.value)}
                        className="pl-12"
                        autoComplete="off"
                    />
                    
                    {/* Suggestions Dropdown */}
                    <AnimatePresence>
                        {showSuggestions && citySuggestions.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute w-full mt-1 bg-surface-light border border-white/10 rounded-2xl overflow-hidden shadow-xl z-50 max-h-48 overflow-y-auto"
                            >
                                {citySuggestions.map((city, index) => (
                                    <button
                                        key={`${city.name}-${city.lat}-${index}`}
                                        type="button"
                                        onClick={() => selectCity(city)}
                                        className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors flex flex-col border-b border-white/5 last:border-0"
                                    >
                                        <span className="text-sm font-medium text-text">{city.name}</span>
                                        <span className="text-xs text-text-secondary">
                                            {city.state ? `${city.state}, ` : ''}India
                                        </span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {locationError && <p className="text-error text-sm mt-2 text-center">{locationError}</p>}
                {watch('location.lat') && <p className="text-success text-sm mt-2 text-center">{t('locationCaptured')}</p>}
            </StepWrapper>
        );
      case 4:
        return (
            <StepWrapper title={t('stepCropsTitle')} onBack={prevStep} onNext={handleSubmit(onSubmit)}>
                <p className="text-center text-text-secondary mb-4">{t('cropsPrompt')}</p>
                <div className="flex flex-wrap gap-3 justify-center">
                    {COMMON_CROPS.map(crop => (
                        <motion.button
                            key={crop}
                            type="button" 
                            onClick={() => handleCropToggle(crop)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            animate={{ 
                                scale: selectedCrops.includes(crop) ? 1.05 : 1,
                                backgroundColor: selectedCrops.includes(crop) ? '#34D399' : '#1A3029',
                                color: selectedCrops.includes(crop) ? '#FFFFFF' : '#E5E7EB'
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className={`px-4 py-2 rounded-xl text-sm shadow-md`}
                        >
                            {crop}
                        </motion.button>
                    ))}
                </div>
                 <Controller name="crops" control={control} rules={{ required: t('cropRequired') }} render={() => <></>} />
                 {errors.crops && <p className="text-error text-sm mt-4 text-center">{errors.crops.message}</p>}
            </StepWrapper>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background rounded-4xl shadow-2xl w-full max-w-md m-4 max-h-[90vh] overflow-y-auto"
      >
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
            >
                {renderStep()}
            </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};


interface StepWrapperProps {
    title: string;
    children: React.ReactNode;
    onNext: () => void;
    onBack?: () => void;
}

const StepWrapper: React.FC<StepWrapperProps> = ({ title, children, onNext, onBack }) => {
    const { t } = useTranslation();
    const isFirstStep = title === t('welcomeTitle');

    return (
        <div className="p-8">
            <div className="flex items-center mb-6">
                {onBack && <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-light mr-4"><ChevronLeft /></button>}
                <h2 className="text-2xl font-bold">{title}</h2>
            </div>
            
            <div className="mb-8">{children}</div>
            
            {!isFirstStep && (
                <Button onClick={onNext} className="w-full">
                    {title === t('stepCropsTitle') ? t('finishSetupButton') : t('continueButton')}
                </Button>
            )}
        </div>
    );
};

export default OnboardingModal;