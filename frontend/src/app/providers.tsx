'use client';

import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { Toaster } from '../components/ui/sonner';
import { ZustandHydration } from '../components/shared/ZustandHydration';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ZustandHydration>
        {children}
        <Toaster position="top-right" richColors closeButton theme="dark" />
      </ZustandHydration>
    </QueryClientProvider>
  );
}
