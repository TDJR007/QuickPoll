import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/*
    📌 import.meta.env is Vite's way of accessing env variables — different from Node's process.env.
    The VITE_ prefix is Vite's security feature, it only exposes variables with that prefix to the browser,
    everything else stays server-side only.
*/