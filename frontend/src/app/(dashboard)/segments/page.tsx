'use client';

import { useState } from 'react';
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
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  Lock,
  Unlock,
} from 'lucide-react';

const segmentFormSchema = zod.object({
  name: zod.string().min(2, { message: 'O nome do segmento deve ter no mínimo 2 caracteres' }).max(100),
});

type SegmentFormValues = zod.infer<typeof segmentFormSchema>;

export default function SegmentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SegmentFormValues>({
    resolver: zodResolver(segmentFormSchema),
  });

  // Busca lista de Segmentos do backend
  const { data: segmentsResponse, isLoading } = useQuery({
    queryKey: ['segments', searchTerm],
    queryFn: async () => {
      const res = await api.get('/segments', {
        params: { search: searchTerm, limit: 100 },
      });
      return res.data;
    },
  });

  const segments = segmentsResponse?.data?.items || [];

  // Mutation de Criar/Editar Segmento
  const saveMutation = useMutation({
    mutationFn: async (data: SegmentFormValues) => {
      if (editingSegment) {
        return api.put(`/segments/${editingSegment.id}`, { name: data.name });
      }
      return api.post('/segments', { name: data.name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast.success(
        editingSegment ? 'Segmento atualizado com sucesso!' : 'Segmento de eleitores criado com sucesso!'
      );
      handleClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Não foi possível salvar o segmento';
      toast.error('Erro ao salvar segmento', {
        description: Array.isArray(msg) ? msg[0] : msg,
      });
    },
  });

  // Mutation de Ativar/Desativar Status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return api.put(`/segments/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast.success('Status do segmento atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao alterar status do segmento');
    },
  });

  // Mutation de Excluir Segmento
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/segments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast.success('Segmento removido com sucesso!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'O segmento possui eleitores vinculados e não pode ser excluído.';
      toast.error('Erro ao excluir segmento', {
        description: Array.isArray(msg) ? msg[0] : msg,
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingSegment(null);
    reset({ name: '' });
    setIsOpen(true);
  };

  const handleOpenEdit = (segment: any) => {
    setEditingSegment(segment);
    reset({ name: segment.name });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingSegment(null);
  };

  const onSubmit = (data: SegmentFormValues) => {
    saveMutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Segmentos e Tags</h1>
          <p className="text-zinc-400">
            Categorize seu eleitorado em grupos sociais, profissionais ou setoriais para comunicação direcionada.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-indigo-650 hover:bg-indigo-750 text-white font-medium gap-1.5 transition-all active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Segmento
        </Button>
      </div>

      {/* Barra de Filtro Rápido */}
      <Card className="bg-zinc-900/40 border-zinc-800/80 backdrop-blur-md">
        <CardContent className="p-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
            <Input
              placeholder="Buscar segmento por nome..."
              className="pl-10 bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-550 focus-visible:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Segmentos */}
      <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Segmentos do Gabinete</CardTitle>
          <CardDescription className="text-zinc-400">
            Tags de categorização ativa para o cadastro de eleitores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full bg-zinc-850" />
              <Skeleton className="h-10 w-full bg-zinc-850" />
            </div>
          ) : segments.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-650">
                <Tag className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-white">Nenhum segmento cadastrado</h3>
              <p className="text-sm text-zinc-500">
                Crie tags como "Comerciantes", "Professores" ou "Lideranças Religiosas".
              </p>
            </div>
          ) : (
            <div className="relative overflow-x-auto border border-zinc-800/80 rounded-lg">
              <table className="w-full text-sm text-left text-zinc-300">
                <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/60 border-b border-zinc-800">
                  <tr>
                    <th scope="col" className="px-6 py-4">Nome do Segmento</th>
                    <th scope="col" className="px-6 py-4 text-center">Status</th>
                    <th scope="col" className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-900/10">
                  {segments.map((segment: any) => (
                    <tr key={segment.id} className="hover:bg-zinc-850/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white flex items-center gap-2">
                        <Tag className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>{segment.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            segment.isActive
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {segment.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenEdit(segment)}
                          className="h-8 w-8 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-850"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            toggleStatusMutation.mutate({ id: segment.id, isActive: !segment.isActive })
                          }
                          className={`h-8 w-8 border-zinc-800 hover:bg-zinc-850 ${
                            segment.isActive ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-350'
                          }`}
                        >
                          {segment.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir este segmento de eleitores?')) {
                              deleteMutation.mutate(segment.id);
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
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {editingSegment ? 'Editar Segmento' : 'Criar Novo Segmento'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Defina a nomenclatura da tag de segmentação para filtrar eleitores da campanha.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-350">Nome do Segmento / Categoria</Label>
              <Input
                id="name"
                placeholder="Ex: Servidores da Educação"
                className="bg-zinc-950/60 border-zinc-800 text-white"
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            <DialogFooter className="mt-6">
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
                {saveMutation.isPending ? 'Salvando...' : 'Salvar Segmento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
