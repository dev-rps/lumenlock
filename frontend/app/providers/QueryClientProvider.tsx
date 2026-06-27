'use client';

import { QueryClient, QueryClientProvider as TanstackProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { getEventPoller } from '../services/events';

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // Start event poller when app mounts
  useEffect(() => {
    const poller = getEventPoller();
    poller.start();
    return () => poller.stop();
  }, []);

  return <TanstackProvider client={queryClient}>{children}</TanstackProvider>;
}
