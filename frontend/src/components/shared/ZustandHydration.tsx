'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useLayoutStore } from '../../store/layoutStore';

interface ZustandHydrationProps {
  children: ReactNode;
}

export function ZustandHydration({ children }: ZustandHydrationProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Força hidratação manual e sincroniza os cookies/localStorage
    const checkState = () => {
      const auth = useAuthStore.persist?.hasHydrated();
      const layout = useLayoutStore.persist?.hasHydrated();

      if (auth && layout) {
        setIsHydrated(true);

        // Aplica o tema correto do layoutStore no DOM do navegador
        const theme = useLayoutStore.getState().theme;
        document.documentElement.classList.toggle('dark', theme === 'dark');
      } else {
        setTimeout(checkState, 30);
      }
    };

    checkState();
  }, []);

  if (!isHydrated) {
    // Um skeleton loading animado sutil para evitar cintilação da tela
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
