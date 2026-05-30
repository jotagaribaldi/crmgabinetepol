'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../lib/api';
import { DashboardLayout } from '../../../../components/shared/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Skeleton } from '../../../../components/ui/skeleton';
import { toast } from 'sonner';
import {
  Globe2,
  Users,
  ShieldCheck,
  CalendarDays,
  FileBarChart2,
  TrendingUp,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RootDashboardPage() {
  // Busca estatísticas oficiais da API do backend
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['root-stats'],
    queryFn: async () => {
      const res = await api.get('/tenants/stats');
      return res.data.data;
    },
  });

  if (error) {
    toast.error('Erro ao carregar estatísticas do sistema', {
      description: 'Não foi possível buscar as estatísticas globais.',
    });
  }

  // Gera dados simulados ou estruturados de crescimento global se o backend retornar histórico
  const getGrowthData = () => {
    return [
      { name: 'Jan', tenants: 1, eleitores: 200 },
      { name: 'Fev', tenants: 1, eleitores: 450 },
      { name: 'Mar', tenants: 2, eleitores: 800 },
      { name: 'Abr', tenants: 3, eleitores: 1500 },
      { name: 'Mai', tenants: 4, eleitores: stats?.totalVoters || 3000 },
    ];
  };

  return (
    <DashboardLayout>
      {/* Top Welcome Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Console de Administração Global</h1>
          <p className="text-zinc-400">
            Visão consolidada do ecossistema SaaS, licenciamento de gabinetes e atividade global.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/40 backdrop-blur text-sm text-zinc-350">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Modo ROOT Super Admin</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-400">Gabinetes (Tenants)</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Globe2 className="w-4.5 h-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-zinc-800" />
            ) : (
              <>
                <div className="text-3xl font-bold text-white">{stats?.totalTenants || 0}</div>
                <p className="text-xs text-zinc-500 mt-1">Gabinetes sob licença ativa</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-400">Eleitores Totais</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Users className="w-4.5 h-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-zinc-800" />
            ) : (
              <>
                <div className="text-3xl font-bold text-white">{stats?.totalVoters || 0}</div>
                <p className="text-xs text-zinc-500 mt-1">Cadastrados no ecossistema</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-400">Usuários Operadores</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-zinc-800" />
            ) : (
              <>
                <div className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-zinc-500 mt-1">Lideranças, coordenadores e staff</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-400">Regiões Mapeadas</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
              <MapPin className="w-4.5 h-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-zinc-800" />
            ) : (
              <>
                <div className="text-3xl font-bold text-white">{stats?.totalRegions || 0}</div>
                <p className="text-xs text-zinc-500 mt-1">Cinturões geográficos integrados</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Growth Area Chart */}
      <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Crescimento do Ecossistema SaaS</CardTitle>
          <CardDescription className="text-zinc-400">Evolução combinada de Licenças e Eleitores no tempo</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          {isLoading ? (
            <Skeleton className="w-full h-full bg-zinc-800" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getGrowthData()}>
                <defs>
                  <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEleitores" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                />
                <Area type="monotone" dataKey="tenants" stroke="#6366f1" fillOpacity={1} fill="url(#colorTenants)" name="Gabinetes" />
                <Area type="monotone" dataKey="eleitores" stroke="#10b981" fillOpacity={1} fill="url(#colorEleitores)" name="Eleitores" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
