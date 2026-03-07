import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      toggle: () => {
        const next = !get().isDark;
        set({ isDark: next });
        document.documentElement.classList.toggle('dark', next);
      },
    }),
    {
      name: 'theme',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.isDark) {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);

/*
📌 Theme preference goes in localStorage not sessionStorage — you want it to survive tab closes.
Nobody wants to re-pick dark mode every session. onRehydrateStorage is the key piece — when the page loads,
Zustand reads the saved preference and immediately applies the dark class before React even renders, preventing a flash of wrong theme.
*/