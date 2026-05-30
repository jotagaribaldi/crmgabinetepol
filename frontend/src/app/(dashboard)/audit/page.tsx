'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { DashboardLayout } from '../../../components/shared/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Skeleton } from '../../../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { toast } from 'sonner';
import {
  ShieldAlert,
  Search,
  Eye,
  Calendar,
  Activity,
  User,
  PlusCircle,
  Edit,
  Trash2,
  Cpu,
  Monitor,
} from 'lucide-react';

export default function AuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Modal para exibir comparativo JSON De / Para
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Busca lista de logs paginada
  const { data: auditResponse, isLoading } = useQuery({
    queryKey: ['audit-logs', searchTerm, actionFilter, entityFilter, page],
    queryFn: async () => {
      const params: any = {
        search: searchTerm,
        page,
        limit: 15,
      };
      if (actionFilter !== 'ALL') params.action = actionFilter;
      if (entityFilter !== 'ALL') params.entity = entityFilter;

      const res = await api.get('/audit', { params });
      return res.data;
    },
  });

  const logs = auditResponse?.data?.items || [];
  const totalItems = auditResponse?.data?.meta?.totalItems || 0;
  const totalPages = auditResponse?.data?.meta?.totalPages || 1;

  // Busca sumário analítico de atividades
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['audit-summary'],
    queryFn: async () => {
      const res = await api.get('/audit/summary');
      return res.data?.data || null;
    },
  });

  const handleOpenDetail = async (logId: string) => {
    try {
      const res = await api.get(`/audit/${logId}`);
      setSelectedLog(res.data?.data || null);
      setIsDetailOpen(true);
    } catch {
      toast.error('Erro ao buscar detalhes do log');
    }
  };

  // Helper para Badge de Ação
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><PlusCircle className="w-3 h-3" /> CRIAR</span>;
      case 'UPDATE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"><Edit className="w-3 h-3" /> EDITAR</span>;
      case 'DELETE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20"><Trash2 className="w-3 h-3" /> EXCLUIR</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">{action}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Histórico de Auditoria</h1>
          <p className="text-zinc-400 font-normal">
            Rastreabilidade e conformidade total das modificações de dados realizadas pela equipe de gabinete.
          </p>
        </div>
      </div>

      {/* Grid de Totalizadores de Atividades */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-zinc-400 uppercase">Criações</CardTitle>
            <PlusCircle className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-7 w-20 bg-zinc-800" />
            ) : (
              <div className="text-2xl font-bold text-white">{summary?.actionSummary?.CREATE || 0}</div>
            )}
            <p className="text-[10px] text-zinc-550 mt-1">Registros criados no período</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-zinc-400 uppercase">Edições</CardTitle>
            <Edit className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-7 w-20 bg-zinc-800" />
            ) : (
              <div className="text-2xl font-bold text-white">{summary?.actionSummary?.UPDATE || 0}</div>
            )}
            <p className="text-[10px] text-zinc-550 mt-1">Modificações de cadastros</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-zinc-400 uppercase">Exclusões</CardTitle>
            <Trash2 className="w-4 h-4 text-red-400" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-7 w-20 bg-zinc-800" />
            ) : (
              <div className="text-2xl font-bold text-white">{summary?.actionSummary?.DELETE || 0}</div>
            )}
            <p className="text-[10px] text-zinc-550 mt-1">Registros removidos da base</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-zinc-400 uppercase">Usuários Ativos</CardTitle>
            <Activity className="w-4 h-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-7 w-20 bg-zinc-800" />
            ) : (
              <div className="text-2xl font-bold text-white">{(summary?.activeUsers || []).length}</div>
            )}
            <p className="text-[10px] text-zinc-550 mt-1">Colaboradores que operaram</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de Auditoria */}
      <Card className="bg-zinc-900/40 border-zinc-800/80 backdrop-blur-md">
        <CardContent className="p-4 grid gap-4 md:grid-cols-4 items-center">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
            <Input
              placeholder="Buscar por usuário, e-mail ou ID..."
              className="pl-10 bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-550"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex gap-2 items-center">
            <Label className="text-xs text-zinc-500 shrink-0">Ação</Label>
            <Select value={actionFilter} onValueChange={(val: any) => { setActionFilter(val || 'ALL'); setPage(1); }}>
              <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-zinc-300 text-xs">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                <SelectItem value="ALL">Todas as Ações</SelectItem>
                <SelectItem value="CREATE">Criação (CREATE)</SelectItem>
                <SelectItem value="UPDATE">Edição (UPDATE)</SelectItem>
                <SelectItem value="DELETE">Exclusão (DELETE)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 items-center">
            <Label className="text-xs text-zinc-500 shrink-0">Entidade</Label>
            <Select value={entityFilter} onValueChange={(val: any) => { setEntityFilter(val || 'ALL'); setPage(1); }}>
              <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-zinc-300 text-xs">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                <SelectItem value="ALL">Todas as Tabelas</SelectItem>
                <SelectItem value="Voter">Eleitores (Voter)</SelectItem>
                <SelectItem value="Region">Regiões (Region)</SelectItem>
                <SelectItem value="Segment">Segmentos (Segment)</SelectItem>
                <SelectItem value="User">Usuários (User)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Histórico */}
      <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full bg-zinc-850" />
              <Skeleton className="h-10 w-full bg-zinc-850" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <ShieldAlert className="w-10 h-10 text-zinc-650 mx-auto" />
              <h3 className="text-lg font-semibold text-white">Nenhum log encontrado</h3>
              <p className="text-sm text-zinc-500">Sem registros de alteração para os filtros fornecidos.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative overflow-x-auto border border-zinc-800/80 rounded-lg">
                <table className="w-full text-sm text-left text-zinc-300">
                  <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/60 border-b border-zinc-800">
                    <tr>
                      <th scope="col" className="px-6 py-4">Operador</th>
                      <th scope="col" className="px-6 py-4">Operação</th>
                      <th scope="col" className="px-6 py-4">Alvo</th>
                      <th scope="col" className="px-6 py-4">Rastreamento</th>
                      <th scope="col" className="px-6 py-4">Carimbo de Data</th>
                      <th scope="col" className="px-6 py-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 bg-zinc-900/10">
                    {logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-zinc-850/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-zinc-850 text-white flex items-center justify-center font-bold text-xs">
                              {log.user?.name?.charAt(0).toUpperCase() || 'S'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-white">{log.user?.name || 'Sistema'}</span>
                              <span className="text-xs text-zinc-500">{log.user?.role || 'Cron/API'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold font-mono">
                          <div className="flex flex-col">
                            <span className="text-indigo-400">{log.entity}</span>
                            <span className="text-zinc-550 text-[10px] truncate max-w-40">ID: {log.entityId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <div className="flex flex-col text-zinc-400 font-mono">
                            <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-zinc-500" /> {log.ipAddress || '127.0.0.1'}</span>
                            <span className="text-[10px] text-zinc-600 truncate max-w-44 flex items-center gap-1">
                              <Monitor className="w-3 h-3 text-zinc-650" /> {log.userAgent || 'Desconhecido'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-400 font-mono">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {log.action === 'UPDATE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-zinc-800 text-zinc-450 hover:text-white hover:bg-zinc-800 text-xs gap-1.5"
                              onClick={() => handleOpenDetail(log.id)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver Alteração
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center shrink-0 pt-2">
                  <span className="text-xs text-zinc-500">Página {page} de {totalPages}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="border-zinc-800 text-zinc-400 hover:text-white"
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="border-zinc-800 text-zinc-400 hover:text-white"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Dialog Detalhe de Auditoria (Comparativo De / Para) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="shrink-0 pb-2">
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              Comparativo de Modificações
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Visualização de valores antes (De) e depois (Para) da edição do registro.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-1 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Antigo Valor */}
                <div className="space-y-2">
                  <Label className="text-red-400 font-bold uppercase tracking-wider text-[10px]">
                    ● Antigo Registro (De)
                  </Label>
                  <pre className="bg-zinc-950/80 border border-red-500/10 rounded-lg p-3 text-red-300 font-mono overflow-auto max-h-60 leading-relaxed text-[11px]">
                    {JSON.stringify(selectedLog.oldValue, null, 2)}
                  </pre>
                </div>

                {/* Novo Valor */}
                <div className="space-y-2">
                  <Label className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                    ● Novo Registro (Para)
                  </Label>
                  <pre className="bg-zinc-950/80 border border-emerald-500/10 rounded-lg p-3 text-emerald-300 font-mono overflow-auto max-h-60 leading-relaxed text-[11px]">
                    {JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
