import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NewsUpdate, SchemeUpdate, Tip } from '../types';

interface ContentState {
  newsUpdates: NewsUpdate[] | null;
  schemeUpdates: SchemeUpdate[] | null;
  tips: Tip[] | null;
  setNewsUpdates: (updates: NewsUpdate[]) => void;
  setSchemeUpdates: (updates: SchemeUpdate[]) => void;
  setTips: (tips: Tip[]) => void;
}

const useContentStore = create<ContentState>()(
  persist(
    (set) => ({
      newsUpdates: null,
      schemeUpdates: null,
      tips: null,
      setNewsUpdates: (updates) => set({ newsUpdates: updates }),
      setSchemeUpdates: (updates) => set({ schemeUpdates: updates }),
      setTips: (tips) => set({ tips }),
    }),
    {
      name: 'krishi-sahayak-content-cache',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useContentStore;