'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { toast } from 'sonner';
import {
  MapPin,
  Plus,
  Search,
  Building,
  Edit2,
  Trash2,
  User,
  Tags,
  Map,
} from 'lucide-react';

const regionFormSchema = zod.object({
  name: zod.string().min(3, { message: 'Mínimo de 3 caracteres' }).max(150),
  stateId: zod.string().min(1, { message: 'Selecione o estado' }),
  description: zod.string().max(500).optional().or(zod.literal('')),
  coordinatorId: zod.string().optional().or(zod.literal('')),
});

type RegionFormValues = zod.infer<typeof regionFormSchema>;

export default function RegionsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<any>(null);

  // Estado e Municípios selecionados no form
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedMunicipalityIds, setSelectedMunicipalityIds] = useState<string[]>([]);
  const [municipalitySearch, setMunicipalitySearch] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RegionFormValues>({
    resolver: zodResolver(regionFormSchema),
  });

  // Busca lista de Regiões
  const { data: regionsResponse, isLoading } = useQuery({
    queryKey: ['regions', searchTerm],
    queryFn: async () => {
      const res = await api.get('/regions', {
        params: { search: searchTerm, limit: 100 },
      });
      return res.data;
    },
  });

  const regions = regionsResponse?.data?.items || [];

  // Busca lista de Estados (para o Select de Estados)
  const { data: statesResponse } = useQuery({
    queryKey: ['states-list'],
    queryFn: async () => {
      const res = await api.get('/states');
      return res.data;
    },
  });

  const states = statesResponse?.data?.items || [];

  // Busca municípios com base no estado selecionado no modal
  const { data: municipalities, isLoading: isLoadingMunicipalities } = useQuery({
    queryKey: ['municipalities-by-state', selectedStateId],
    queryFn: async () => {
      if (!selectedStateId) return [];
      const res = await api.get(`/municipalities/state/${selectedStateId}/all`);
      return res.data?.data || [];
    },
    enabled: !!selectedStateId,
  });

  // Busca coordenadores para vincular à região (usuários com role COORDENADOR ou CHEFEGAB)
  const { data: coordinatorsResponse } = useQuery({
    queryKey: ['coordinators-list'],
    queryFn: async () => {
      const res = await api.get('/users', { params: { limit: 100 } });
      return res.data;
    },
  });

  const potentialCoordinators = (coordinatorsResponse?.data?.items || []).filter(
    (u: any) => u.role === 'COORDENADOR' || u.role === 'CHEFEGAB' || u.role === 'POLITICO'
  );

  // Mutation de Criar/Editar Região
  const saveMutation = useMutation({
    mutationFn: async (data: RegionFormValues) => {
      const payload: any = {
        name: data.name,
        stateId: data.stateId,
        description: data.description || undefined,
        coordinatorId: data.coordinatorId || undefined,
        municipalityIds: selectedMunicipalityIds,
      };

      if (editingRegion) {
        return api.put(`/regions/${editingRegion.id}`, payload);
      }
      return api.post('/regions', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      toast.success(
        editingRegion ? 'Região atualizada com sucesso!' : 'Região territorial criada com sucesso!'
      );
      handleClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Não foi possível salvar a região';
      toast.error('Erro ao salvar região', {
        description: Array.isArray(msg) ? msg[0] : msg,
      });
    },
  });

  // Mutation de Excluir Região
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/regions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      toast.success('Região territorial removida com sucesso!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'A região possui eleitores vinculados e não pode ser removida.';
      toast.error('Erro ao excluir região', {
        description: Array.isArray(msg) ? msg[0] : msg,
      });
    },
  });

  // Sincroniza estado selecionado no modal
  useEffect(() => {
    if (selectedStateId) {
      setValue('stateId', selectedStateId);
    }
  }, [selectedStateId, setValue]);

  const handleOpenCreate = () => {
    setEditingRegion(null);
    setSelectedStateId('');
    setSelectedMunicipalityIds([]);
    setMunicipalitySearch('');
    reset({
      name: '',
      stateId: '',
      description: '',
      coordinatorId: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (region: any) => {
    setEditingRegion(region);
    setSelectedStateId(region.stateId);

    // Carrega municípios já vinculados à região
    const linkedIds = (region.municipalities || []).map((m: any) => m.municipalityId);
    setSelectedMunicipalityIds(linkedIds);
    setMunicipalitySearch('');

    reset({
      name: region.name,
      stateId: region.stateId,
      description: region.description || '',
      coordinatorId: region.coordinatorId || '',
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingRegion(null);
    setSelectedStateId('');
    setSelectedMunicipalityIds([]);
  };

  const onSubmit = (data: RegionFormValues) => {
    saveMutation.mutate(data);
  };

  // Funções do Multiselect de Municípios
  const toggleMunicipality = (id: string) => {
    if (selectedMunicipalityIds.includes(id)) {
      setSelectedMunicipalityIds(selectedMunicipalityIds.filter((item) => item !== id));
    } else {
      setSelectedMunicipalityIds([...selectedMunicipalityIds, id]);
    }
  };

  const filteredMunicipalities = (municipalities || []).filter((m: any) =>
    m.name.toLowerCase().includes(municipalitySearch.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Regiões e Territórios</h1>
          <p className="text-zinc-400">
            Delimite e gerencie zonas geográficas de atuação para melhor coordenar sua militância e cabos eleitorais.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-indigo-650 hover:bg-indigo-750 text-white font-medium gap-1.5 transition-all active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Região
        </Button>
      </div>

      {/* Barra de Filtro Rápido */}
      <Card className="bg-zinc-900/40 border-zinc-800/80 backdrop-blur-md">
        <CardContent className="p-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
            <Input
              placeholder="Buscar região por nome ou coordenador..."
              className="pl-10 bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-550 focus-visible:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Regiões */}
      <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Regiões de Campanha</CardTitle>
          <CardDescription className="text-zinc-400">
            Zonas e cinturões geográficos configurados sob o isolamento do seu gabinete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full bg-zinc-850" />
              <Skeleton className="h-10 w-full bg-zinc-850" />
            </div>
          ) : regions.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-650">
                <Map className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-white">Nenhuma região delimitada</h3>
              <p className="text-sm text-zinc-500">
                Crie sua primeira região de campanha e vincule os municípios desejados.
              </p>
            </div>
          ) : (
            <div className="relative overflow-x-auto border border-zinc-800/80 rounded-lg">
              <table className="w-full text-sm text-left text-zinc-300">
                <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/60 border-b border-zinc-800">
                  <tr>
                    <th scope="col" className="px-6 py-4">Região</th>
                    <th scope="col" className="px-6 py-4">Estado</th>
                    <th scope="col" className="px-6 py-4">Cidades Vinculadas</th>
                    <th scope="col" className="px-6 py-4">Coordenador</th>
                    <th scope="col" className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-900/10">
                  {regions.map((region: any) => (
                    <tr key={region.id} className="hover:bg-zinc-850/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">
                        <div className="flex flex-col">
                          <span>{region.name}</span>
                          <span className="text-xs font-normal text-zinc-500 truncate max-w-sm">
                            {region.description || 'Sem descrição'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-300">
                        {region.state?.abbreviation || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {region.municipalities?.length || 0} cidade(s)
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {region.coordinator ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-zinc-850 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                              {region.coordinator.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-white">{region.coordinator.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500 italic">Sem coordenador</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenEdit(region)}
                          className="h-8 w-8 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-850"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta região territorial?')) {
                              deleteMutation.mutate(region.id);
                            }
                          }}
                          className="h-8 w-8 text-red-400 border-zinc-800 hover:text-red-300 hover:bg-red-500/5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Dialog Form */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl max-h-[95vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl font-bold text-white">
              {editingRegion ? 'Editar Região' : 'Delimitar Nova Região'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Defina o nome da região, estado de atuação, coordenador político e filtre as cidades abrangidas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-y-auto space-y-4 pr-1 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-350">Nome da Região</Label>
                <Input
                  id="name"
                  placeholder="Ex: Zona Leste de São Paulo"
                  className="bg-zinc-950/60 border-zinc-800 text-white"
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-350">Estado (UF)</Label>
                <Select
                  value={selectedStateId}
                  onValueChange={(val: any) => {
                    setSelectedStateId(val || '');
                    setSelectedMunicipalityIds([]); // Limpa as cidades se o estado mudar
                  }}
                >
                  <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-300">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 max-h-48 overflow-y-auto">
                    {states.map((s: any) => (
                      <SelectItem key={s.id} value={s.id} className="focus:bg-zinc-800 focus:text-white">
                        {s.name} ({s.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stateId && <p className="text-xs text-red-400">{errors.stateId.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coordinatorId" className="text-zinc-350">Coordenador Responsável</Label>
                <Select
                  value={editingRegion ? editingRegion.coordinatorId || 'NONE' : undefined}
                  onValueChange={(val: any) => setValue('coordinatorId', val === 'NONE' ? undefined : val)}
                >
                  <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-300">
                    <SelectValue placeholder="Selecione o coordenador" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                    <SelectItem value="NONE" className="focus:bg-zinc-800 focus:text-white">Sem coordenador</SelectItem>
                    {potentialCoordinators.map((c: any) => (
                      <SelectItem key={c.id} value={c.id} className="focus:bg-zinc-800 focus:text-white">
                        {c.name} ({c.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-zinc-350">Descrição / Notas</Label>
                <Input
                  id="description"
                  placeholder="Anotações gerais..."
                  className="bg-zinc-950/60 border-zinc-800 text-white"
                  {...register('description')}
                />
              </div>
            </div>

            {/* Multiselect de Municípios */}
            {selectedStateId && (
              <div className="space-y-2 border-t border-zinc-850 pt-4 flex-1 flex flex-col min-h-[180px] overflow-hidden">
                <div className="flex justify-between items-center mb-1 shrink-0">
                  <Label className="text-zinc-300 font-semibold">Selecione as Cidades Vinculadas</Label>
                  <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/5 px-2 py-0.5 rounded">
                    {selectedMunicipalityIds.length} selecionada(s)
                  </span>
                </div>

                <div className="relative mb-2 shrink-0">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <Input
                    placeholder="Filtrar cidades por nome..."
                    className="pl-8 h-8 bg-zinc-950/60 border-zinc-800 text-xs text-white"
                    value={municipalitySearch}
                    onChange={(e) => setMunicipalitySearch(e.target.value)}
                  />
                </div>

                <div className="flex-1 overflow-y-auto border border-zinc-800 bg-zinc-950/30 rounded-lg p-2 space-y-1 max-h-[220px]">
                  {isLoadingMunicipalities ? (
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-full bg-zinc-850" />
                      <Skeleton className="h-6 w-full bg-zinc-850" />
                    </div>
                  ) : filteredMunicipalities.length === 0 ? (
                    <p className="text-center text-xs text-zinc-650 py-4">Nenhuma cidade encontrada.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {filteredMunicipalities.map((city: any) => {
                        const isChecked = selectedMunicipalityIds.includes(city.id);
                        return (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => toggleMunicipality(city.id)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-left cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                                : 'bg-zinc-900/50 border border-zinc-800 text-zinc-450 hover:bg-zinc-800/40 hover:text-white'
                            }`}
                          >
                            <span className="truncate">{city.name}</span>
                            <span className="text-[9px] font-mono text-zinc-550 shrink-0 font-normal">
                              {city.ibgeCode}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar Região'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
