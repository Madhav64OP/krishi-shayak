
import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, Leaf, Check, Languages, ChevronLeft } from 'lucide-react';

import useProfileStore from '../../store/profileStore';
import type { Profile } from '../../types';
import { COMMON_CROPS, INDIAN_STATES, LANGUAGES } from '../../constants';
import { Button, Input, Select } from '../ui';
import { useTranslation } from '../../hooks/useTranslation';

type OnboardingData = Omit<Profile, 'version' | 'location'> & {
    location: { city: string; lat: number | null; lng: number | null };
};

const OnboardingModal = (): React.ReactNode => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [locationError, setLocationError] = useState('');
  const setProfile = useProfileStore((state) => state.setProfile);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<OnboardingData>({
    defaultValues: {
      language: 'en',
      crops: [],
      location: { lat: null, lng: null, city: '' },
    },
  });

  const selectedCrops = watch('crops');

  const handleGetLocation = () => {
    setLocationError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('location.lat', position.coords.latitude);
          setValue('location.lng', position.coords.longitude);
          // In a real app, you would use a reverse geocoding API here.
          setValue('location.city', 'Auto-detected'); 
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
          setLocationError(t('locationIsRequired'));
          setStep(3);
          return;
      }
      const finalProfile: Profile = {
        ...data,
        version: 1,
        location: {
            city: data.location.city || 'Unknown',
            lat: data.location.lat,
            lng: data.location.lng
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
                                     <button 
                                        onClick={() => {
                                            field.onChange(lang.code)
                                            // Immediately go to next step after language selection
                                            setTimeout(() => nextStep(), 100);
                                        }}
                                        className={`w-full p-3 rounded-2xl text-left transition-colors duration-200 ${field.value === lang.code ? 'bg-primary text-white' : 'bg-surface-light hover:bg-surface'}`}
                                    >
                                        {lang.name}
                                    </button>
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
                <Button onClick={handleGetLocation} className="w-full mb-4">{t('autoDetectLocationButton')}</Button>
                <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <Input placeholder={t('cityPlaceholder')} {...register('location.city')} className="pl-12" />
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
                        <button
                            key={crop}
                            onClick={() => handleCropToggle(crop)}
                            className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 shadow-md ${selectedCrops.includes(crop) ? 'bg-primary text-white scale-105' : 'bg-surface-light hover:bg-surface'}`}
                        >
                            {crop}
                        </button>
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
