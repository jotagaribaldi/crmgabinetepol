'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';

const forgotSchema = zod.object({
  email: zod.string().email({ message: 'Insira um e-mail válido' }),
});

type ForgotFormValues = zod.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setIsLoading(true);
    try {
      // Simula chamada de redefinição
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSent(true);
      toast.success('E-mail enviado com sucesso!', {
        description: `Enviamos as instruções para ${data.email}`,
      });
    } catch (err: any) {
      toast.error('Erro de conexão', {
        description: 'Não foi possível completar a solicitação.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-zinc-950 to-zinc-950" />
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <Card className="w-full max-w-md bg-zinc-900/70 border-zinc-800/80 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Recuperar Senha</CardTitle>
          <CardDescription className="text-zinc-400">
            Insira o seu e-mail cadastrado e enviaremos um link de redefinição
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSent ? (
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
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-750 text-white font-medium py-2.5 rounded-lg shadow-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin mx-auto" />
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-white">Instruções enviadas!</h3>
              <p className="text-sm text-zinc-400">
                Se o e-mail estiver cadastrado em nossa base, você receberá um link seguro de recuperação em instantes.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center pb-6">
          <a
            href="/login"
            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o login
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}
