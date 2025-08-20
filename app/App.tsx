import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import useProfileStore from './store/profileStore';
import OnboardingModal from './components/onboarding/OnboardingModal';
import HomeScreen from './screens/HomeScreen';
import UpdatesScreen from './screens/UpdatesScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatScreen from './screens/ChatScreen';
import SchemesScreen from './screens/SchemesScreen';
import PlantDiseaseScreen from './screens/PlantDiseaseScreen';
import { TranslationProvider } from './contexts/TranslationContext';
import { useTranslation } from './hooks/useTranslation';

function App(): React.ReactNode {
  return (
    <TranslationProvider>
      <AppContent />
    </TranslationProvider>
  );
}

function AppContent(): React.ReactNode {
  const { profile, isInitialized } = useProfileStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { t, isTranslationsLoaded } = useTranslation();

  useEffect(() => {
    if (isInitialized) {
      setShowOnboarding(!profile);
    }
  }, [profile, isInitialized]);

  if (!isInitialized || !isTranslationsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        {/* Replaced t('loading') with hardcoded text to avoid dependency on unloaded translations */}
        <div className="text-xl text-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className="font-sans">
      {showOnboarding && <OnboardingModal />}
      <HashRouter>
        <Routes>
          <Route path="/" element={profile ? <HomeScreen /> : <Navigate to="/welcome" />} />
          <Route path="/updates" element={profile ? <UpdatesScreen /> : <Navigate to="/welcome" />} />
          <Route path="/schemes" element={profile ? <SchemesScreen /> : <Navigate to="/welcome" />} />
          <Route path="/profile" element={profile ? <ProfileScreen /> : <Navigate to="/welcome" />} />
          <Route path="/chat" element={profile ? <ChatScreen /> : <Navigate to="/welcome" />} />
          <Route path="/plant-disease" element={profile ? <PlantDiseaseScreen /> : <Navigate to="/welcome" />} />
          <Route path="/welcome" element={!profile ? <WelcomeScreen /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

const WelcomeScreen = (): React.ReactNode => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-text p-4 text-center">
            <h1 className="text-3xl font-bold text-primary mb-4">{t('welcomeTitle')}</h1>
            <p>{t('onboardingPrompt')}</p>
            <p className="text-sm text-text-secondary mt-2">{t('onboardingRefresh')}</p>
        </div>
    );
};


export default App;