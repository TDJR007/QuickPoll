import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  setAuth: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setAuth: (user) => set({ user }),
      clearAuth: () => set({ user: null }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

/*
    📌 Notice the store has both state (user) and actions (setAuth, clearAuth) living together.
    set is how you update state in Zustand — you pass it an object with whatever you want to change and it merges it in.
    When setAuth is called anywhere in the app, every component subscribed to user or token re-renders automatically with the new values. 
    That's the whole magic of Zustand in one function.

    we persist user in sessionStorage — that's fine, it's not sensitive.
    It's just an id and email so the UI knows who's logged in.
    The JWT itself — the sensitive part — never touches JS accessible storage, it lives in the httpOnly cookie only.
    This is the correct split. 
    withCredentials: true on axios tells the browser to send cookies cross-origin, without it the cookie would be silently ignored.
*/