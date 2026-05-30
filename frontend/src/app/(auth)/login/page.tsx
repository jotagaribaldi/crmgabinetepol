'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Lock, Mail, ShieldAlert, Sparkles } from 'lucide-react';

const loginSchema = zod.object({
  email: zod.string().email({ message: 'Insira um e-mail válido' }),
  password: zod.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres' }),
});

type LoginFormValues = zod.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const { accessToken, refreshToken, user } = response.data.data;

      // Salva sessão no Zustand e localStorage
      setSession(accessToken, refreshToken, user);

      toast.success(`Boas-vindas de volta, ${user.name}!`, {
        description: `Logado como ${user.role}`,
      });

      // Redireciona de acordo com o nível de acesso
      if (user.role === 'ROOT') {
        router.push('/dashboard/root');
      } else {
        router.push('/dashboard/tenant');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'E-mail ou senha incorretos';
      toast.error('Erro de autenticação', {
        description: Array.isArray(msg) ? msg[0] : msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 overflow-hidden px-4">
      {/* Background futurista com círculos brilhantes degradê */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-zinc-950 to-zinc-950" />
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />

      {/* Grid abstrato de fundo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <Card className="w-full max-w-md bg-zinc-900/70 border-zinc-800/80 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-2">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">CRM Político</CardTitle>
          <CardDescription className="text-zinc-400">
            Acesse o seu gabinete inteligente e gerencie sua campanha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@campanha.com.br"
                  className="pl-10 bg-zinc-950/50 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-indigo-500"
                  {...register('email')}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-300">
                  Senha
                </Label>
                <a
                  href="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-zinc-950/50 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-indigo-500"
                  {...register('password')}
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-750 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-indigo-500/10 transition-all hover:shadow-indigo-500/20 active:scale-98"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin mx-auto" />
              ) : (
                'Entrar no Painel'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center pb-6">
          <p className="text-xs text-zinc-500">
            Plataforma restrita e auditada. Tentativas suspeitas serão registradas.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
