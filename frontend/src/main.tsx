import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './index.css';
import App from './App';
import { useAuthStore } from './store/authStore';
import { api } from './api/client';

const queryClient = new QueryClient();

// rehydrate user from cookie on app load
const { user, setAuth } = useAuthStore.getState();
if (!user) {
  api.get('/auth/me')
    .then(res => setAuth(res.data.user))
    .catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);

/*
  📌 QueryClientProvider wraps the entire app so every component can access Tanstack Query.
  ReactQueryDevtools gives you a little panel in the browser to inspect your queries, cache state, and refetch manually — invaluable for debugging. 
  It only shows in development.
*/