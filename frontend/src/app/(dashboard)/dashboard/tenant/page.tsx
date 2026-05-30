'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../lib/api';
import { DashboardLayout } from '../../../../components/shared/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Skeleton } from '../../../../components/ui/skeleton';
import { toast } from 'sonner';
import {
  Users,
  MapPin,
  Tag,
  FolderLock,
  Percent,
  TrendingUp,
  Award,
  CalendarDays,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function TenantDashboardPage() {
  // Busca estatísticas oficiais da API do backend
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['tenant-stats'],
    queryFn: async () => {
      const res = await api.get('/voters/stats');
      return res.data.data;
    },
  });

  if (error) {
    toast.error('Erro ao carregar métricas', {
      description: 'Não foi possível buscar as estatísticas do servidor.',
    });
  }

  // Cores personalizadas para o gráfico de pizza (Apoio)
  const SUPPORT_COLORS = {
    CONFIRMADO: '#10b981', // Verde esmeralda
    PROVAVEL: '#3b82f6',    // Azul
    INDEFINIDO: '#eab308',  // Amarelo
    CONTRARIO: '#ef4444',   // Vermelho
  };

  const getPieData = () => {
    if (!stats || !stats.bySupportStatus) return [];
    return stats.bySupportStatus.map((s: any) => ({
      name: s.status,
      value: s.count,
    }));
  };

  const getBarData = () => {
    if (!stats || !stats.bySegment) return [];
    return stats.bySegment.map((s: any) => ({
      name: s.segmentName,
      quantidade: s.count,
    }));
  };

  const getMunicipalityData = () => {
    if (!stats || !stats.byMunicipality) return [];
    return stats.byMunicipality.map((m: any) => ({
      name: m.municipalityName,
      quantidade: m.count,
    }));
  };

  return (
    <DashboardLayout>
      {/* Top Welcome Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Painel de Controle</h1>
          <p className="text-zinc-400">
            Acompanhe em tempo real o desempenho, eleitorado e lideranças de sua campanha.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/40 backdrop-blur text-sm text-zinc-300">
          <CalendarDays className="w-4 h-4 text-indigo-400" />
          <span>Atualizado hoje</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-400">Total de Eleitores</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Users className="w-4.5 h-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-zinc-800" />
            ) : (
              <>
                <div className="text-3xl font-bold text-white">{stats?.total || 0}</div>
                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">+{stats?.recentGrowth || 0}</span> nos últimos 30 dias
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-400">Taxa de Apoio</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Percent className="w-4.5 h-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-zinc-800" />
            ) : (
              <>
                <div className="text-3xl font-bold text-white">
                  {(() => {
                    const total = stats?.total || 0;
                    if (total === 0) return '0%';
                    const confirmados = stats?.bySupportStatus?.find((s: any) => s.status === 'CONFIRMADO')?.count || 0;
                    const provaveis = stats?.bySupportStatus?.find((s: any) => s.status === 'PROVAVEL')?.count || 0;
                    return `${(((confirmados + provaveis) / total) * 100).toFixed(1)}%`;
                  })()}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Soma de Confirmados & Prováveis</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-400">Regiões Ativas</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <MapPin className="w-4.5 h-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-zinc-800" />
            ) : (
              <>
                <div className="text-3xl font-bold text-white">{stats?.byRegion?.length || 0}</div>
                <p className="text-xs text-zinc-500 mt-1">Regiões coordenadas</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-400">Segmentos Criados</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Tag className="w-4.5 h-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-zinc-800" />
            ) : (
              <>
                <div className="text-3xl font-bold text-white">{stats?.bySegment?.length || 0}</div>
                <p className="text-xs text-zinc-500 mt-1">Tipos de segmentação ativa</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bar Chart segments */}
        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Eleitores por Segmento</CardTitle>
            <CardDescription className="text-zinc-400">Distribuição nos 10 maiores grupos de apoio</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="w-full h-full bg-zinc-800" />
            ) : getBarData().length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500">Nenhum dado cadastrado</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getBarData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                  />
                  <Bar dataKey="quantidade" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart Support Status */}
        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Intenção de Voto / Apoio</CardTitle>
            <CardDescription className="text-zinc-400">Métricas de engajamento do eleitorado</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {isLoading ? (
              <Skeleton className="w-full h-full bg-zinc-800" />
            ) : getPieData().length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500">Nenhum dado cadastrado</div>
            ) : (
              <div className="w-full h-full flex flex-col sm:flex-row items-center justify-around">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {getPieData().map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={SUPPORT_COLORS[entry.name as keyof typeof SUPPORT_COLORS] || '#71717a'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {getPieData().map((item: any) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: SUPPORT_COLORS[item.name as keyof typeof SUPPORT_COLORS] || '#71717a' }}
                      />
                      <span className="text-xs text-zinc-300 font-semibold">{item.name}:</span>
                      <span className="text-xs text-zinc-400">{item.value} eleitor(es)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Municipality Performance */}
        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md md:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Presença Geográfica (Municípios)</CardTitle>
            <CardDescription className="text-zinc-400">Eleitores distribuídos nas principais cidades da campanha</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="w-full h-full bg-zinc-800" />
            ) : getMunicipalityData().length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500">Nenhum dado cadastrado</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getMunicipalityData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" />
                  <YAxis dataKey="name" type="category" stroke="#71717a" width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                  />
                  <Bar dataKey="quantidade" fill="#a855f7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
