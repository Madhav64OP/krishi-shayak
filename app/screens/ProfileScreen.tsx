
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut } from 'lucide-react';
import useProfileStore from '../store/profileStore';
import { Card, Button } from '../components/ui';
import { useTranslation } from '../hooks/useTranslation';
import { LANGUAGES } from '../constants';

const ProfileScreen = (): React.ReactNode => {
    const { profile, clearProfile } = useProfileStore();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleReset = () => {
        clearProfile();
        navigate('/welcome', { replace: true });
    };

    if (!profile) return null;

    const languageName = LANGUAGES.find(lang => lang.code === profile.language)?.name || profile.language;

    return (
        <div className="min-h-screen bg-background p-4">
            <header className="flex items-center mb-6">
                <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-surface-light mr-4">
                    <ChevronLeft />
                </button>
                <h1 className="text-2xl font-bold">{t('profileTitle')}</h1>
            </header>

            <main className="space-y-4">
                <Card>
                    <ProfileItem label={t('profileLabelName')} value={profile.name} />
                    <ProfileItem label={t('profileLabelPhone')} value={profile.phone} />
                    <ProfileItem label={t('profileLabelState')} value={profile.state} />
                    <ProfileItem label={t('profileLabelCity')} value={profile.location.city} />
                    <ProfileItem label={t('profileLabelLanguage')} value={languageName} />
                    <ProfileItem label={t('profileLabelCrops')} value={profile.crops.join(', ')} />
                </Card>

                <Button onClick={handleReset} className="w-full bg-error/80 hover:bg-error flex items-center justify-center">
                    <LogOut className="mr-2 h-5 w-5" />
                    {t('resetProfileButton')}
                </Button>
                 <p className="text-xs text-center text-text-secondary mt-2">{t('resetProfileWarning')}</p>
            </main>
        </div>
    );
};

interface ProfileItemProps {
    label: string;
    value: string;
}

const ProfileItem: React.FC<ProfileItemProps> = ({ label, value }) => (
    <div className="py-3 border-b border-surface-light last:border-b-0">
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="text-lg font-semibold text-text">{value}</p>
    </div>
);

export default ProfileScreen;
