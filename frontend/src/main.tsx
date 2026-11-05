import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { createQueryClient } from './app/queryClient';
import { routes } from './app/router';
import { ROUTES } from './lib/routes';
import './styles/tokens.css';
import './styles/global.css';

const router = createBrowserRouter(routes);
const queryClient = createQueryClient({
  onUnauthenticated: () => void router.navigate(ROUTES.login, { replace: true }),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
