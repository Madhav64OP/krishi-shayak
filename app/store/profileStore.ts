
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Profile } from '../types';

interface ProfileState {
  profile: Profile | null;
  isInitialized: boolean;
  setProfile: (profile: Profile) => void;
  clearProfile: () => void;
  _setIsInitialized: (isInitialized: boolean) => void;
}

const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      isInitialized: false,
      setProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null }),
      _setIsInitialized: (isInitialized) => set({ isInitialized }),
    }),
    {
      name: 'krishi-sahayak-profile',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._setIsInitialized(true);
        }
      },
    }
  )
);

// Manually trigger initialization if rehydration doesn't happen (e.g., first visit)
const initialState = useProfileStore.getState();
if (!initialState.isInitialized) {
  initialState._setIsInitialized(true);
}


export default useProfileStore;
