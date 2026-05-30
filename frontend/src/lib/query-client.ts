import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Evita re-buscas excessivas ao alternar abas
      retry: 1, // Tenta refazer a query 1 vez caso falhe
      staleTime: 1000 * 60 * 5, // 5 minutos de cache padrão
    },
  },
});
