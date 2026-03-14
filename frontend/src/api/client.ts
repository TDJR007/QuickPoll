import axios from 'axios';
import { router } from '../router.tsx';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      router.navigate('/rate-limit');
    }
    return Promise.reject(error);
  }
);

/*
    📌 import.meta.env is Vite's way of accessing env variables — different from Node's process.env.
    The VITE_ prefix is Vite's security feature, it only exposes variables with that prefix to the browser,
    everything else stays server-side only.
*/