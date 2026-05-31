'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { DashboardLayout } from '../../../components/shared/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from 'sonner';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  MapPin,
  Tag,
  ShieldAlert,
  Users,
  Compass,
  Award,
} from 'lucide-react';

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<string>('voters');
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'xlsx'>('xlsx');
  
  // States de filtros
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [regionId, setRegionId] = useState('ALL');
  const [segmentId, setSegmentId] = useState('ALL');
  const [municipalityId, setMunicipalityId] = useState('ALL');

  const [isGenerating, setIsGenerating] = useState(false);

  // Busca dados auxiliares para filtros do modal
  const { data: regions } = useQuery({
    queryKey: ['regions-report'],
    queryFn: async () => {
      const res = await api.get('/regions', { params: { limit: 100 } });
      return res.data?.data?.items || [];
    },
  });

  const { data: segments } = useQuery({
    queryKey: ['segments-report'],
    queryFn: async () => {
      const res = await api.get('/segments', { params: { limit: 100 } });
      return res.data?.data?.items || [];
    },
  });

  const { data: municipalities } = useQuery({
    queryKey: ['municipalities-report'],
    queryFn: async () => {
      const res = await api.get('/states');
      const state = res.data?.data?.items?.[0];
      if (!state) return [];
      const mRes = await api.get(`/municipalities/state/${state.id}/all`);
      return mRes.data?.data || [];
    },
  });

  // Função para lidar com a geração do relatório
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    const token = useAuthStore.getState().accessToken;

    const payload: any = {
      type: selectedType,
      format: selectedFormat,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      regionId: regionId !== 'ALL' ? regionId : undefined,
      segmentId: segmentId !== 'ALL' ? segmentId : undefined,
      municipalityId: municipalityId !== 'ALL' ? municipalityId : undefined,
    };

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/reports/generate`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Falha no download');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `relatorio_${selectedType}_${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      a.click();
      toast.success('Relatório gerado e baixado com sucesso!');
    } catch {
      toast.error('Erro ao gerar relatório', {
        description: 'Verifique se o período e os parâmetros de filtros selecionados estão corretos.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const reportCards = [
    {
      id: 'voters',
      title: 'Listagem de Eleitores',
      desc: 'Exportação detalhada da base completa de eleitores do gabinete com campos territoriais e contatos.',
      icon: Users,
      color: 'text-indigo-400 bg-indigo-500/5',
    },
    {
      id: 'voters_by_region',
      title: 'Consolidado por Região',
      desc: 'Mapeamento de votantes agrupados pelas zonas e cinturões geográficos delimitados.',
      icon: Compass,
      color: 'text-amber-400 bg-amber-500/5',
    },
    {
      id: 'voters_by_segment',
      title: 'Consolidado por Segmento',
      desc: 'Eleitores classificados por grupos de interesses, profissões, classes ou tag social.',
      icon: Tag,
      color: 'text-violet-400 bg-violet-500/5',
    },
    {
      id: 'voters_by_municipality',
      title: 'Distribuição por Cidade',
      desc: 'Eleitorado agrupado pelos municípios que integram as zonas de abrangência do gabinete.',
      icon: MapPin,
      color: 'text-emerald-400 bg-emerald-500/5',
    },
    {
      id: 'leaders_performance',
      title: 'Desempenho de Lideranças',
      desc: 'Desempenho e número de eleitores captados individualmente por cada coordenador e líder de campo.',
      icon: Award,
      color: 'text-pink-400 bg-pink-500/5',
    },
    {
      id: 'audit_summary',
      title: 'Log de Auditoria de Ações',
      desc: 'Rastreabilidade total das atividades e alterações feitas por operadores no banco de dados.',
      icon: ShieldAlert,
      color: 'text-red-400 bg-red-500/5',
    },
  ];

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Central de Relatórios</h1>
        <p className="text-zinc-400">
          Gere e baixe extratos consolidados nos formatos Excel ou CSV para inteligência de dados da sua campanha.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lado Esquerdo: Cards de Tipos de Relatórios */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-350 uppercase tracking-wider">
            1. Selecione o Tipo de Relatório
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {reportCards.map((report) => {
              const isSelected = selectedType === report.id;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedType(report.id)}
                  className={`w-full text-left p-5 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 ${
                    isSelected
                      ? 'bg-zinc-900 border-indigo-500 shadow-md shadow-indigo-500/5'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.color}`}>
                    <report.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{report.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-normal">{report.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lado Direito: Filtros e Botão Gerar */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-350 uppercase tracking-wider">
            2. Ajuste os Parâmetros & Formato
          </h2>
          <Card className="bg-zinc-900 border-zinc-800/80 backdrop-blur-md sticky top-6">
            <CardHeader>
              <CardTitle className="text-white text-base">Configurações de Exportação</CardTitle>
              <CardDescription className="text-zinc-400">
                Refine as datas ou filtros de isolamento para a extração dos dados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Formato */}
              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs">Formato de Saída</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('xlsx')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                      selectedFormat === 'xlsx'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    Microsoft Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('csv')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                      selectedFormat === 'csv'
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Delimitado CSV (.csv)
                  </button>
                </div>
              </div>

              {/* Período */}
              <div className="space-y-2">
                <Label className="text-zinc-300 text-xs">Filtrar por Período de Cadastro</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="dateFrom" className="text-[10px] text-zinc-500">De</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      className="bg-zinc-950/60 border-zinc-800 text-xs h-9.5 text-white"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dateTo" className="text-[10px] text-zinc-500">Até</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      className="bg-zinc-950/60 border-zinc-800 text-xs h-9.5 text-white"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Filtros Geográficos Avançados (apenas visíveis se aplicáveis ao tipo do relatório) */}
              {selectedType !== 'audit_summary' && (
                <div className="space-y-4 border-t border-zinc-850 pt-4">
                  {/* Região */}
                  <div className="space-y-1.5">
                    <Label className="text-zinc-300 text-xs">Filtrar por Região</Label>
                    <Select value={regionId} onValueChange={(val: any) => setRegionId(val || 'ALL')}>
                      <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-300 text-xs h-9.5">
                        <SelectValue placeholder="Selecione a região" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                        <SelectItem value="ALL">Todas as Regiões</SelectItem>
                        {(regions || []).map((r: any) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Segmento */}
                  <div className="space-y-1.5">
                    <Label className="text-zinc-300 text-xs">Filtrar por Segmento</Label>
                    <Select value={segmentId} onValueChange={(val: any) => setSegmentId(val || 'ALL')}>
                      <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-300 text-xs h-9.5">
                        <SelectValue placeholder="Selecione o segmento" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                        <SelectItem value="ALL">Todos os Segmentos</SelectItem>
                        {(segments || []).map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Município */}
                  <div className="space-y-1.5">
                    <Label className="text-zinc-300 text-xs">Filtrar por Município</Label>
                    <Select value={municipalityId} onValueChange={(val: any) => setMunicipalityId(val || 'ALL')}>
                      <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-300 text-xs h-9.5">
                        <SelectValue placeholder="Selecione o município" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 max-h-48 overflow-y-auto">
                        <SelectItem value="ALL">Todos os Municípios</SelectItem>
                        {(municipalities || []).map((m: any) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Botão de Disparo do Download */}
              <Button
                onClick={handleGenerateReport}
                className="w-full bg-indigo-650 hover:bg-indigo-750 text-white font-semibold flex items-center justify-center gap-2 h-10 mt-6 cursor-pointer"
                disabled={isGenerating}
              >
                <Download className="w-4.5 h-4.5" />
                {isGenerating ? 'Compilando Planilha...' : 'Gerar e Baixar Relatório'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
