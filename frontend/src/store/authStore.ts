import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'ROOT' | 'POLITICO' | 'CHEFEGAB' | 'COORDENADOR' | 'LIDERREG' | 'LIDERLOCAL';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserSession | null;
  isAuthenticated: boolean;
  setSession: (accessToken: string, refreshToken: string, user: UserSession) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setSession: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user, isAuthenticated: true }),
      clearSession: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'crm-politico-auth',
    }
  )
);
