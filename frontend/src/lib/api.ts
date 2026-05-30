import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de requisições: injeta o Bearer token dinamicamente
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Acessa o token do estado persistido do Zustand diretamente
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respostas: intercepta expirations (401) e executa Refresh Token automático
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Se já está atualizando o token, enfileira a requisição corrente
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const currentRefreshToken = useAuthStore.getState().refreshToken;
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      // Chama rota silenciosa de Refresh Token
      const res = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: currentRefreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken, user } = res.data.data;

      // Salva novos dados na store do Zustand
      useAuthStore.getState().setSession(accessToken, newRefreshToken, user);

      processQueue(null, accessToken);
      isRefreshing = false;

      // Refaz a requisição original com o novo token de acesso
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      isRefreshing = false;

      // Limpa sessão e redireciona caso falhe a renovação do Refresh Token
      useAuthStore.getState().clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/login?expired=true';
      }
      return Promise.reject(refreshError);
    }
  }
);
