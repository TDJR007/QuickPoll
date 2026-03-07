import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null }),
}));

/*
    📌 Notice the store has both state (user, token) and actions (setAuth, clearAuth) living together.
    set is how you update state in Zustand — you pass it an object with whatever you want to change and it merges it in.
    When setAuth is called anywhere in the app, every component subscribed to user or token re-renders automatically with the new values. 
    That's the whole magic of Zustand in one function.
*/