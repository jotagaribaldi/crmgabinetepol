'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Search,
  Filter,
  UserPlus,
  Building,
  Edit2,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  MapPin,
  Tags,
} from 'lucide-react';

// Schema do formulário com 20+ campos
const voterFormSchema = zod.object({
  name: zod.string().min(3, { message: 'Mínimo de 3 caracteres' }).max(150),
  cpf: zod.string().optional().or(zod.literal('')),
  phone: zod.string().optional().or(zod.literal('')),
  whatsapp: zod.string().optional().or(zod.literal('')),
  email: zod.string().email({ message: 'E-mail inválido' }).optional().or(zod.literal('')),
  birthDate: zod.string().optional().or(zod.literal('')),
  sex: zod.string().optional().or(zod.literal('')),
  
  // Endereço
  zipCode: zod.string().optional().or(zod.literal('')),
  address: zod.string().optional().or(zod.literal('')),
  number: zod.string().optional().or(zod.literal('')),
  complement: zod.string().optional().or(zod.literal('')),
  neighborhood: zod.string().optional().or(zod.literal('')),
  municipalityId: zod.string().optional().or(zod.literal('')),

  // Alinhamento Político & Organização
  supportStatus: zod.string().optional(),
  observations: zod.string().optional().or(zod.literal('')),
  regionId: zod.string().optional().or(zod.literal('')),
  segmentId: zod.string().optional().or(zod.literal('')),
  coordinatorId: zod.string().optional().or(zod.literal('')),
  regionalLeaderId: zod.string().optional().or(zod.literal('')),
  localLeaderId: zod.string().optional().or(zod.literal('')),
});

type VoterFormValues = zod.infer<typeof voterFormSchema>;

export default function VotersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // States de filtros e listagem
  const [searchTerm, setSearchTerm] = useState('');
  const [supportFilter, setSupportFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [segmentFilter, setSegmentFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Modal formulário CRUD
  const [isOpen, setIsOpen] = useState(false);
  const [editingVoter, setEditingVoter] = useState<any>(null);

  // Anti-duplicidade visual inline
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Estado para importador CSV
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<VoterFormValues>({
    resolver: zodResolver(voterFormSchema),
  });

  // Watchers para anti-duplicidade inline
  const watchCpf = watch('cpf');
  const watchPhone = watch('phone');
  const watchWhatsapp = watch('whatsapp');

  // Trigger anti-duplicidade inline
  useEffect(() => {
    const checkDuplicate = async () => {
      if (!watchCpf && !watchPhone && !watchWhatsapp) {
        setDuplicateWarning(null);
        return;
      }
      setIsCheckingDuplicate(true);
      try {
        // Busca na API eleitores que batem com esses valores
        const searchVal = watchCpf || watchPhone || watchWhatsapp;
        const res = await api.get('/voters', {
          params: { search: searchVal, limit: 1 },
        });

        const items = res.data?.data?.items || [];
        // Filtra para não avisar dele mesmo se estiver editando
        const matched = items.find((item: any) => item.id !== editingVoter?.id);

        if (matched) {
          let field = '';
          if (watchCpf && matched.cpf === watchCpf) field = 'CPF';
          else if (watchPhone && matched.phone === watchPhone) field = 'Celular';
          else if (watchWhatsapp && matched.whatsapp === watchWhatsapp) field = 'WhatsApp';

          setDuplicateWarning(`Atenção: Já existe um eleitor cadastrado (${matched.name}) com este ${field}!`);
        } else {
          setDuplicateWarning(null);
        }
      } catch {
        // Falha silenciosa
      } finally {
        setIsCheckingDuplicate(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      checkDuplicate();
    }, 600); // Debounce de 600ms para evitar requisições pesadas

    return () => clearTimeout(delayDebounce);
  }, [watchCpf, watchPhone, watchWhatsapp, editingVoter]);

  // Busca lista de Eleitores paginada
  const { data: votersResponse, isLoading } = useQuery({
    queryKey: ['voters', searchTerm, supportFilter, regionFilter, segmentFilter, page],
    queryFn: async () => {
      const params: any = {
        search: searchTerm,
        page,
        limit: 15,
      };
      if (supportFilter !== 'ALL') params.supportStatus = supportFilter;
      if (regionFilter !== 'ALL') params.regionId = regionFilter;
      if (segmentFilter !== 'ALL') params.segmentId = segmentFilter;

      const res = await api.get('/voters', { params });
      return res.data;
    },
  });

  const voters = votersResponse?.data?.items || [];
  const totalItems = votersResponse?.data?.meta?.totalItems || 0;
  const totalPages = votersResponse?.data?.meta?.totalPages || 1;

  // Busca cadastros auxiliares do tenant para o formulário
  const { data: regions } = useQuery({
    queryKey: ['regions-list'],
    queryFn: async () => {
      const res = await api.get('/regions', { params: { limit: 100 } });
      return res.data?.data?.items || [];
    },
  });

  const { data: segments } = useQuery({
    queryKey: ['segments-list'],
    queryFn: async () => {
      const res = await api.get('/segments', { params: { limit: 100 } });
      return res.data?.data?.items || [];
    },
  });

  // Busca usuários para coordenadores/líderes
  const { data: usersResponse } = useQuery({
    queryKey: ['cabinet-staff'],
    queryFn: async () => {
      const res = await api.get('/users', { params: { limit: 100 } });
      return res.data?.data?.items || [];
    },
  });

  const staff = usersResponse || [];
  const coordinators = staff.filter((u: any) => u.role === 'COORDENADOR' || u.role === 'CHEFEGAB');
  const regionalLeaders = staff.filter((u: any) => u.role === 'LIDERREG');
  const localLeaders = staff.filter((u: any) => u.role === 'LIDERLOCAL');

  // Busca cidades do estado do tenant (ex: SP) para o endereço
  const { data: municipalities } = useQuery({
    queryKey: ['municipalities-voter-form'],
    queryFn: async () => {
      // Pega estado padrão (como SP)
      const res = await api.get('/states');
      const state = res.data?.[0]; // Pega primeiro estado ativo
      if (!state) return [];
      const mRes = await api.get(`/municipalities/state/${state.id}/all`);
      return mRes.data?.data || [];
    },
  });

  // Mutation de Criar/Editar Eleitor
  const saveMutation = useMutation({
    mutationFn: async (data: VoterFormValues) => {
      const payload: any = { ...data };
      
      // Limpa chaves vazias para aceitar UUIDs opcionais corretos no backend
      if (!payload.regionId) delete payload.regionId;
      if (!payload.segmentId) delete payload.segmentId;
      if (!payload.coordinatorId) delete payload.coordinatorId;
      if (!payload.regionalLeaderId) delete payload.regionalLeaderId;
      if (!payload.localLeaderId) delete payload.localLeaderId;
      if (!payload.municipalityId) delete payload.municipalityId;
      if (!payload.birthDate) delete payload.birthDate;
      else payload.birthDate = new Date(payload.birthDate).toISOString();

      if (editingVoter) {
        return api.put(`/voters/${editingVoter.id}`, payload);
      }
      return api.post('/voters', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters'] });
      toast.success(
        editingVoter ? 'Cadastro de eleitor atualizado!' : 'Eleitor cadastrado com sucesso!'
      );
      handleClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erro ao salvar cadastro do eleitor';
      toast.error('Erro ao salvar eleitor', {
        description: Array.isArray(msg) ? msg[0] : msg,
      });
    },
  });

  // Mutation de Excluir Eleitor
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/voters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters'] });
      toast.success('Eleitor removido com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir cadastro do eleitor');
    },
  });

  const handleOpenCreate = () => {
    setEditingVoter(null);
    setDuplicateWarning(null);
    reset({
      name: '',
      cpf: '',
      phone: '',
      whatsapp: '',
      email: '',
      birthDate: '',
      sex: '',
      zipCode: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      municipalityId: '',
      supportStatus: 'INDEFINIDO',
      observations: '',
      regionId: '',
      segmentId: '',
      coordinatorId: '',
      regionalLeaderId: '',
      localLeaderId: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (voter: any) => {
    setEditingVoter(voter);
    setDuplicateWarning(null);
    reset({
      name: voter.name,
      cpf: voter.cpf || '',
      phone: voter.phone || '',
      whatsapp: voter.whatsapp || '',
      email: voter.email || '',
      birthDate: voter.birthDate ? new Date(voter.birthDate).toISOString().split('T')[0] : '',
      sex: voter.sex || '',
      zipCode: voter.zipCode || '',
      address: voter.address || '',
      number: voter.number || '',
      complement: voter.complement || '',
      neighborhood: voter.neighborhood || '',
      municipalityId: voter.municipalityId || '',
      supportStatus: voter.supportStatus || 'INDEFINIDO',
      observations: voter.observations || '',
      regionId: voter.regionId || '',
      segmentId: voter.segmentId || '',
      coordinatorId: voter.coordinatorId || '',
      regionalLeaderId: voter.regionalLeaderId || '',
      localLeaderId: voter.localLeaderId || '',
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingVoter(null);
    setDuplicateWarning(null);
  };

  const onSubmit = (data: VoterFormValues) => {
    saveMutation.mutate(data);
  };

  // Trata exportação de dados
  const handleExport = (format: 'csv' | 'xlsx') => {
    const token = useAuthStore.getState().accessToken;
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/voters/export/${format}?search=${searchTerm}`;
    
    // Inicia download direto anexando token
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const fileUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = `eleitores_gabinete.${format}`;
        a.click();
        toast.success(`Exportação em ${format.toUpperCase()} iniciada!`);
      })
      .catch(() => toast.error('Erro na exportação de dados.'));
  };

  // Trata importação de CSV
  const handleImportCSV = async () => {
    if (!selectedFile) {
      toast.error('Selecione uma planilha de eleitores válida (.csv).');
      return;
    }
    setIsImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/voters/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['voters'] });
      toast.success('Processamento do arquivo CSV finalizado!', {
        description: `Importados com sucesso: ${res.data?.successCount || 0}`,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Falha ao processar arquivo.';
      toast.error('Erro na importação', {
        description: Array.isArray(msg) ? msg[0] : msg,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Eleitores</h1>
          <p className="text-zinc-400 font-normal">
            Painel analítico do eleitorado, controle de apoio político e ferramentas de captação de votos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentUser && ['POLITICO', 'CHEFEGAB', 'ROOT'].includes(currentUser.role) && (
            <>
              <Button
                variant="outline"
                onClick={() => handleExport('xlsx')}
                className="border-zinc-800 text-zinc-400 hover:text-white"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Exportar Excel
              </Button>
            </>
          )}
          <Button
            onClick={handleOpenCreate}
            className="bg-indigo-650 hover:bg-indigo-750 text-white font-medium gap-1.5 transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Eleitor
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="bg-zinc-950/60 border border-zinc-850 p-1">
          <TabsTrigger value="list" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-1.5" />
            Base de Eleitores
          </TabsTrigger>
          {currentUser && ['POLITICO', 'CHEFEGAB', 'ROOT'].includes(currentUser.role) && (
            <TabsTrigger value="import" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white">
              <Upload className="w-4 h-4 mr-1.5" />
              Importar Planilha (CSV)
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Painel de Filtros Avançados */}
          <Card className="bg-zinc-900/40 border-zinc-800/80 backdrop-blur-md">
            <CardContent className="p-4 grid gap-4 md:grid-cols-4 items-center">
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
                <Input
                  placeholder="Nome, CPF ou Celular..."
                  className="pl-10 bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-550"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {/* Filtro Apoio */}
              <div className="flex gap-2 items-center">
                <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
                <Select value={supportFilter} onValueChange={(val: any) => { setSupportFilter(val || 'ALL'); setPage(1); }}>
                  <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-zinc-300 text-xs">
                    <SelectValue placeholder="Intenção de Voto" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                    <SelectItem value="ALL" className="focus:bg-zinc-800">Todos os Status</SelectItem>
                    <SelectItem value="CONFIRMADO" className="focus:bg-zinc-800">Confirmado</SelectItem>
                    <SelectItem value="PROVAVEL" className="focus:bg-zinc-800">Provável</SelectItem>
                    <SelectItem value="INDEFINIDO" className="focus:bg-zinc-800">Indefinido</SelectItem>
                    <SelectItem value="CONTRARIO" className="focus:bg-zinc-800">Contrário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro Região */}
              <div className="flex gap-2 items-center">
                <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                <Select value={regionFilter} onValueChange={(val: any) => { setRegionFilter(val || 'ALL'); setPage(1); }}>
                  <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-zinc-300 text-xs">
                    <SelectValue placeholder="Região territorial" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 max-h-48 overflow-y-auto">
                    <SelectItem value="ALL" className="focus:bg-zinc-800">Todas as Regiões</SelectItem>
                    {(regions || []).map((r: any) => (
                      <SelectItem key={r.id} value={r.id} className="focus:bg-zinc-800">{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro Segmento */}
              <div className="flex gap-2 items-center">
                <Tags className="w-4 h-4 text-zinc-500 shrink-0" />
                <Select value={segmentFilter} onValueChange={(val: any) => { setSegmentFilter(val || 'ALL'); setPage(1); }}>
                  <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-zinc-300 text-xs">
                    <SelectValue placeholder="Segmento social" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 max-h-48 overflow-y-auto">
                    <SelectItem value="ALL" className="focus:bg-zinc-800">Todos os Segmentos</SelectItem>
                    {(segments || []).map((s: any) => (
                      <SelectItem key={s.id} value={s.id} className="focus:bg-zinc-800">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Eleitores */}
          <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-white">Eleitores Mapeados</CardTitle>
                <CardDescription className="text-zinc-400">
                  Total de {totalItems} cadastros organizados por perfil.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full bg-zinc-850" />
                  <Skeleton className="h-10 w-full bg-zinc-850" />
                </div>
              ) : voters.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-650">
                    <Users className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-medium text-white">Nenhum eleitor encontrado</h3>
                  <p className="text-sm text-zinc-500">
                    Comece cadastrando um eleitor ou importando sua planilha.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative overflow-x-auto border border-zinc-800/80 rounded-lg">
                    <table className="w-full text-sm text-left text-zinc-300">
                      <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/60 border-b border-zinc-800">
                        <tr>
                          <th scope="col" className="px-6 py-4">Nome do Eleitor</th>
                          <th scope="col" className="px-6 py-4">Intenção / Apoio</th>
                          <th scope="col" className="px-6 py-4">Contato</th>
                          <th scope="col" className="px-6 py-4">Região / Segmento</th>
                          <th scope="col" className="px-6 py-4">Liderança</th>
                          <th scope="col" className="px-6 py-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 bg-zinc-900/10">
                        {voters.map((voter: any) => (
                          <tr key={voter.id} className="hover:bg-zinc-850/30 transition-colors">
                            <td className="px-6 py-4 font-semibold text-white">
                              <div className="flex flex-col">
                                <span>{voter.name}</span>
                                <span className="text-xs font-mono font-normal text-zinc-550">
                                  CPF: {voter.cpf || 'Não informado'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  voter.supportStatus === 'CONFIRMADO'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : voter.supportStatus === 'PROVAVEL'
                                    ? 'bg-blue-500/10 text-blue-400'
                                    : voter.supportStatus === 'CONTRARIO'
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-amber-500/10 text-amber-400'
                                }`}
                              >
                                {voter.supportStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col text-xs text-zinc-400">
                                <span className="font-mono">{voter.whatsapp || voter.phone || '-'}</span>
                                <span className="truncate">{voter.email || '-'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-indigo-400">
                                  {voter.region?.name || 'Sem Região'}
                                </span>
                                <span className="text-xs text-zinc-500">
                                  {voter.segment?.name || 'Sem Segmento'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs">
                              {voter.coordinator?.name || voter.regionalLeader?.name || 'Nenhum'}
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleOpenEdit(voter)}
                                className="h-8 w-8 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-850"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              {currentUser && ['POLITICO', 'CHEFEGAB', 'ROOT'].includes(currentUser.role) && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm('Tem certeza de que deseja remover este eleitor?')) {
                                      deleteMutation.mutate(voter.id);
                                    }
                                  }}
                                  className="h-8 w-8 text-red-400 border-zinc-800 hover:text-red-300 hover:bg-red-500/5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          {/* Drag & Drop Importador */}
          <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Assistente de Importação CSV</CardTitle>
              <CardDescription className="text-zinc-400">
                Selecione uma planilha de eleitores no formato CSV estruturado. Colunas recomendadas: `nome`, `telefone`, `whatsapp`, `email`, `cpf`, `bairro`, `cep`, `observacoes`.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-zinc-950/20 hover:border-indigo-500/40 hover:bg-zinc-950/30 transition-all">
                <FileSpreadsheet className="w-12 h-12 text-indigo-400 mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">Selecionar arquivo CSV</h3>
                <p className="text-xs text-zinc-500 mb-4">Apenas arquivos no formato delimitado por vírgula (.csv) até 5MB</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="csv-file-upload"
                />
                <label htmlFor="csv-file-upload">
                  <Button type="button" className="bg-indigo-650 hover:bg-indigo-750 text-white text-xs cursor-pointer">
                    Escolher Planilha
                  </Button>
                </label>
                {selectedFile && (
                  <p className="text-xs font-mono text-emerald-400 mt-4 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1 rounded-md">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                {selectedFile && (
                  <Button
                    onClick={handleImportCSV}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    disabled={isImporting}
                  >
                    {isImporting ? 'Processando dados...' : 'Importar Eleitores'}
                  </Button>
                )}
              </div>

              {/* Tabela Interativa de Erros e Logs da Importação */}
              {importResult && (
                <div className="border-t border-zinc-850 pt-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-emerald-500/5 border border-emerald-500/15 p-4 rounded-xl">
                      <p className="text-xs text-zinc-500">Cadastros Importados com Sucesso</p>
                      <h4 className="text-2xl font-bold text-emerald-400 mt-1">{importResult.successCount || 0}</h4>
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/15 p-4 rounded-xl">
                      <p className="text-xs text-zinc-500">Erros / Linhas Puladas</p>
                      <h4 className="text-2xl font-bold text-amber-400 mt-1">{(importResult.errors || []).length}</h4>
                    </div>
                    <div className="bg-indigo-500/5 border border-indigo-500/15 p-4 rounded-xl">
                      <p className="text-xs text-zinc-500">Total de Linhas Processadas</p>
                      <h4 className="text-2xl font-bold text-indigo-400 mt-1">
                        {(importResult.successCount || 0) + (importResult.errors || []).length}
                      </h4>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-red-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Relatório de Erros por Linha
                      </Label>
                      <div className="max-h-56 overflow-y-auto border border-zinc-850 rounded-lg">
                        <table className="w-full text-xs text-left text-zinc-400">
                          <thead className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase font-bold">
                            <tr>
                              <th scope="col" className="px-4 py-2 text-center">Linha</th>
                              <th scope="col" className="px-4 py-2">Dado / Nome</th>
                              <th scope="col" className="px-4 py-2">Motivo da Falha</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-850 bg-zinc-950/10">
                            {importResult.errors.map((err: any, idx: number) => (
                              <tr key={idx} className="hover:bg-red-500/5">
                                <td className="px-4 py-2.5 font-mono text-center font-bold text-zinc-500">
                                  {err.rowNumber || idx + 1}
                                </td>
                                <td className="px-4 py-2.5 text-zinc-300 font-semibold">{err.identifier || 'Desconhecido'}</td>
                                <td className="px-4 py-2.5 text-red-400 font-medium">{err.error || 'Duplicado/Erro de validação'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Dialog Form CRUD com 20+ campos */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="shrink-0 pb-2">
            <DialogTitle className="text-xl font-bold text-white">
              {editingVoter ? 'Editar Cadastro de Eleitor' : 'Cadastrar Novo Eleitor'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Preencha todos os campos do perfil do eleitor. As chaves de unicidade por tenant serão validadas inline.
            </DialogDescription>
          </DialogHeader>

          {/* Banner de Aviso Anti-duplicidade Inline */}
          {duplicateWarning && (
            <div className="shrink-0 mb-3 mx-1 bg-amber-500/10 border border-amber-500/25 p-3 rounded-lg text-amber-400 text-xs font-semibold flex items-start gap-2 shadow-md animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-y-auto space-y-4 pr-1 py-1">
            {/* Sessão 1: Dados Pessoais */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-zinc-850 pb-1.5">
                Dados Pessoais & Contatos
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-zinc-350 text-xs">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Nome completo do eleitor"
                    className="bg-zinc-950/60 border-zinc-800 text-white text-xs h-9.5"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-[10px] text-red-400">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cpf" className="text-zinc-350 text-xs">CPF (Unicidade)</Label>
                  <Input
                    id="cpf"
                    placeholder="Apenas números"
                    className="bg-zinc-950/60 border-zinc-800 text-white font-mono text-xs h-9.5"
                    {...register('cpf')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-zinc-350 text-xs">Celular / Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="DDD + Número"
                    className="bg-zinc-950/60 border-zinc-800 text-white font-mono text-xs h-9.5"
                    {...register('phone')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp" className="text-zinc-350 text-xs">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="DDD + Número"
                    className="bg-zinc-950/60 border-zinc-800 text-white font-mono text-xs h-9.5"
                    {...register('whatsapp')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-zinc-350 text-xs">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@provedor.com"
                    className="bg-zinc-950/60 border-zinc-800 text-white text-xs h-9.5"
                    {...register('email')}
                  />
                  {errors.email && <p className="text-[10px] text-red-400">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="birthDate" className="text-zinc-350 text-xs">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    className="bg-zinc-950/60 border-zinc-800 text-white text-xs h-9.5"
                    {...register('birthDate')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-zinc-350 text-xs">Sexo / Gênero</Label>
                  <Select
                    defaultValue={editingVoter?.sex || undefined}
                    onValueChange={(val: any) => setValue('sex', val === 'NONE' ? undefined : val)}
                  >
                    <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-300 text-xs h-9.5">
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                      <SelectItem value="MASCULINO" className="focus:bg-zinc-800">Masculino</SelectItem>
                      <SelectItem value="FEMININO" className="focus:bg-zinc-800">Feminino</SelectItem>
                      <SelectItem value="OUTRO" className="focus:bg-zinc-800">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Sessão 2: Endereço */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-zinc-850 pb-1.5">
                Localização & Endereço
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="zipCode" className="text-zinc-350 text-xs">CEP</Label>
                  <Input
                    id="zipCode"
                    placeholder="Apenas números"
                    className="bg-zinc-950/60 border-zinc-800 text-white font-mono text-xs h-9.5"
                    {...register('zipCode')}
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="address" className="text-zinc-350 text-xs">Logradouro / Rua</Label>
                  <Input
                    id="address"
                    placeholder="Rua, Avenida..."
                    className="bg-zinc-950/60 border-zinc-800 text-white text-xs h-9.5"
                    {...register('address')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="number" className="text-zinc-350 text-xs">Número</Label>
                  <Input
                    id="number"
                    placeholder="S/N"
                    className="bg-zinc-950/60 border-zinc-800 text-white text-xs h-9.5"
                    {...register('number')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="complement" className="text-zinc-350 text-xs">Complemento</Label>
                  <Input
                    id="complement"
                    placeholder="Apto, Bloco..."
                    className="bg-zinc-950/60 border-zinc-800 text-white text-xs h-9.5"
                    {...register('complement')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="neighborhood" className="text-zinc-350 text-xs">Bairro</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Nome do Bairro"
                    className="bg-zinc-950/60 border-zinc-800 text-white text-xs h-9.5"
                    {...register('neighborhood')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-350 text-xs">Município / Cidadania</Label>
                <Select
                  defaultValue={editingVoter?.municipalityId || undefined}
                  onValueChange={(val: any) => setValue('municipalityId', val === 'NONE' ? undefined : val)}
                >
                  <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-300 text-xs h-9.5">
                    <SelectValue placeholder="Selecione o município base" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 max-h-48 overflow-y-auto">
                    <SelectItem value="NONE" className="focus:bg-zinc-800">Sem vínculo</SelectItem>
                    {(municipalities || []).map((m: any) => (
                      <SelectItem key={m.id} value={m.id} className="focus:bg-zinc-800">{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sessão 3: Alinhamento Político & Organização */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-zinc-850 pb-1.5">
                Alinhamento Político & Lideranças
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-zinc-350 text-xs">Voto / Intenção</Label>
                  <Select
                    defaultValue={editingVoter?.supportStatus || 'INDEFINIDO'}
                    onValueChange={(val: any) => setValue('supportStatus', val || 'INDEFINIDO')}
                  >
                    <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-300 text-xs h-9.5">
                      <SelectValue placeholder="Alinhamento" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                      <SelectItem value="CONFIRMADO" className="focus:bg-zinc-800">Confirmado</SelectItem>
                      <SelectItem value="PROVAVEL" className="focus:bg-zinc-800">Provável</SelectItem>
                      <SelectItem value="INDEFINIDO" className="focus:bg-zinc-800">Indefinido</SelectItem>
                      <SelectItem value="CONTRARIO" className="focus:bg-zinc-800">Contrário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-zinc-350 text-xs">Região Territorial</Label>
                  <Select
                    defaultValue={editingVoter?.regionId || undefined}
                    onValueChange={(val: any) => setValue('regionId', val === 'NONE' ? undefined : val)}
                  >
                    <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-300 text-xs h-9.5">
                      <SelectValue placeholder="Zona de captação" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                      <SelectItem value="NONE" className="focus:bg-zinc-800">Sem Região</SelectItem>
                      {(regions || []).map((r: any) => (
                        <SelectItem key={r.id} value={r.id} className="focus:bg-zinc-800">{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-zinc-350 text-xs">Segmento Social</Label>
                  <Select
                    defaultValue={editingVoter?.segmentId || undefined}
                    onValueChange={(val: any) => setValue('segmentId', val === 'NONE' ? undefined : val)}
                  >
                    <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-300 text-xs h-9.5">
                      <SelectValue placeholder="Grupo social" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                      <SelectItem value="NONE" className="focus:bg-zinc-800">Sem Segmento</SelectItem>
                      {(segments || []).map((s: any) => (
                        <SelectItem key={s.id} value={s.id} className="focus:bg-zinc-800">{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-zinc-350 text-xs">Coordenador</Label>
                  <Select
                    defaultValue={editingVoter?.coordinatorId || undefined}
                    onValueChange={(val: any) => setValue('coordinatorId', val === 'NONE' ? undefined : val)}
                  >
                    <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-300 text-xs h-9.5">
                      <SelectValue placeholder="Coordenador Geral" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 max-h-48 overflow-y-auto">
                      <SelectItem value="NONE" className="focus:bg-zinc-800">Nenhum</SelectItem>
                      {coordinators.map((c: any) => (
                        <SelectItem key={c.id} value={c.id} className="focus:bg-zinc-800">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-zinc-350 text-xs">Líder Regional</Label>
                  <Select
                    defaultValue={editingVoter?.regionalLeaderId || undefined}
                    onValueChange={(val: any) => setValue('regionalLeaderId', val === 'NONE' ? undefined : val)}
                  >
                    <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-300 text-xs h-9.5">
                      <SelectValue placeholder="Líder do Cinturão" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 max-h-48 overflow-y-auto">
                      <SelectItem value="NONE" className="focus:bg-zinc-800">Nenhum</SelectItem>
                      {regionalLeaders.map((r: any) => (
                        <SelectItem key={r.id} value={r.id} className="focus:bg-zinc-800">{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-zinc-350 text-xs">Líder Local</Label>
                  <Select
                    defaultValue={editingVoter?.localLeaderId || undefined}
                    onValueChange={(val: any) => setValue('localLeaderId', val === 'NONE' ? undefined : val)}
                  >
                    <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-300 text-xs h-9.5">
                      <SelectValue placeholder="Líder do Bairro" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 max-h-48 overflow-y-auto">
                      <SelectItem value="NONE" className="focus:bg-zinc-800">Nenhum</SelectItem>
                      {localLeaders.map((l: any) => (
                        <SelectItem key={l.id} value={l.id} className="focus:bg-zinc-800">{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="observations" className="text-zinc-350 text-xs">Observações / Demandas</Label>
                <Input
                  id="observations"
                  placeholder="Problemas de asfalto, saneamento, apoio com exames..."
                  className="bg-zinc-950/60 border-zinc-800 text-white text-xs h-9.5"
                  {...register('observations')}
                />
              </div>
            </div>

            <DialogFooter className="mt-6 shrink-0 pt-4 border-t border-zinc-850">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-zinc-800 text-zinc-400 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-650 hover:bg-indigo-750 text-white font-medium"
                disabled={saveMutation.isPending || isCheckingDuplicate}
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar Eleitor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
