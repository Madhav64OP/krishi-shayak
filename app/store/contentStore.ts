import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NewsUpdate, SchemeUpdate } from '../types';

interface ContentState {
  newsUpdates: NewsUpdate[] | null;
  schemeUpdates: SchemeUpdate[] | null;
  setNewsUpdates: (updates: NewsUpdate[]) => void;
  setSchemeUpdates: (updates: SchemeUpdate[]) => void;
}

const useContentStore = create<ContentState>()(
  persist(
    (set) => ({
      newsUpdates: null,
      schemeUpdates: null,
      setNewsUpdates: (updates) => set({ newsUpdates: updates }),
      setSchemeUpdates: (updates) => set({ schemeUpdates: updates }),
    }),
    {
      name: 'krishi-sahayak-content-cache',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useContentStore;
