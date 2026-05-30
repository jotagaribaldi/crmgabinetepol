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
  Globe2,
  Plus,
  Search,
  Building,
  Edit2,
  Lock,
  Unlock,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';

const tenantFormSchema = zod.object({
  name: zod.string().min(3, { message: 'Mínimo de 3 caracteres' }),
  slug: zod.string().min(3, { message: 'Mínimo de 3 caracteres' }).regex(/^[a-z0-9-]+$/, {
    message: 'Apenas letras minúsculas, números e hifens',
  }),
  document: zod.string().optional(),
  email: zod.string().email({ message: 'E-mail inválido' }).or(zod.literal('')),
  phone: zod.string().optional(),
  party: zod.string().optional(),
  position: zod.string().optional(),
  state: zod.string().max(2, { message: 'Use apenas a sigla (ex: SP)' }).optional(),
  city: zod.string().optional(),
});

type TenantFormValues = zod.infer<typeof tenantFormSchema>;

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
  });

  // Busca lista de Tenants oficiais
  const { data: tenantsResponse, isLoading } = useQuery({
    queryKey: ['tenants', searchTerm],
    queryFn: async () => {
      const res = await api.get('/tenants', {
        params: { search: searchTerm, limit: 100 },
      });
      return res.data;
    },
  });

  const tenants = tenantsResponse?.data?.items || [];

  // Mutation de Criar/Editar
  const saveMutation = useMutation({
    mutationFn: async (data: TenantFormValues) => {
      // Formata e limpa campos vazios antes de enviar
      const payload: any = { ...data };
      if (!payload.email) payload.email = undefined;

      if (editingTenant) {
        return api.put(`/tenants/${editingTenant.id}`, payload);
      }
      return api.post('/tenants', payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success(
        editingTenant ? 'Gabinete atualizado com sucesso!' : 'Gabinete criado com sucesso!',
        {
          description: editingTenant
            ? 'Alterações salvas no banco.'
            : 'O novo tenant e seu usuário administrador estão prontos.',
        }
      );
      handleClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Não foi possível salvar os dados';
      toast.error('Erro ao salvar gabinete', {
        description: Array.isArray(msg) ? msg[0] : msg,
      });
    },
  });

  // Mutation de Status (Ativar/Desativar)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return api.put(`/tenants/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Status do gabinete alterado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao alterar status');
    },
  });

  const handleOpenCreate = () => {
    setEditingTenant(null);
    reset({
      name: '',
      slug: '',
      document: '',
      email: '',
      phone: '',
      party: '',
      position: '',
      state: '',
      city: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (tenant: any) => {
    setEditingTenant(tenant);
    reset({
      name: tenant.name,
      slug: tenant.slug,
      document: tenant.document || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      party: tenant.party || '',
      position: tenant.position || '',
      state: tenant.state || '',
      city: tenant.city || '',
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingTenant(null);
  };

  const onSubmit = (data: TenantFormValues) => {
    saveMutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Gabinetes e Candidatos</h1>
          <p className="text-zinc-400">
            Administração central dos gabinetes (tenants) criados e licenciados no ecossistema.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-indigo-650 hover:bg-indigo-750 text-white font-medium gap-1.5 transition-all active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Gabinete
        </Button>
      </div>

      {/* Barra de Filtro Rápido */}
      <Card className="bg-zinc-900/40 border-zinc-800/80 backdrop-blur-md">
        <CardContent className="p-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
            <Input
              placeholder="Buscar gabinete por nome, slug ou partido..."
              className="pl-10 bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-550 focus-visible:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tenants */}
      <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Lista de Gabinetes</CardTitle>
          <CardDescription className="text-zinc-400">
            Candidatos sob licença ativa ou pausada no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full bg-zinc-850" />
              <Skeleton className="h-10 w-full bg-zinc-850" />
              <Skeleton className="h-10 w-full bg-zinc-850" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-650">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-white">Nenhum gabinete encontrado</h3>
              <p className="text-sm text-zinc-500">
                Crie um novo gabinete para liberar o acesso de novos candidatos.
              </p>
            </div>
          ) : (
            <div className="relative overflow-x-auto border border-zinc-800/80 rounded-lg">
              <table className="w-full text-sm text-left text-zinc-300">
                <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/60 border-b border-zinc-800">
                  <tr>
                    <th scope="col" className="px-6 py-4">Gabinete / Candidato</th>
                    <th scope="col" className="px-6 py-4">Slug (Subdomínio)</th>
                    <th scope="col" className="px-6 py-4">Partido / Cargo</th>
                    <th scope="col" className="px-6 py-4">UF / Cidade</th>
                    <th scope="col" className="px-6 py-4 text-center">Status</th>
                    <th scope="col" className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-900/10">
                  {tenants.map((tenant: any) => (
                    <tr key={tenant.id} className="hover:bg-zinc-850/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">
                        <div className="flex flex-col">
                          <span>{tenant.name}</span>
                          <span className="text-xs font-normal text-zinc-500">{tenant.email || 'Sem e-mail'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{tenant.slug}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span>{tenant.party || 'Não informado'}</span>
                          <span className="text-xs text-zinc-500">{tenant.position || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {tenant.state ? `${tenant.city || ''} (${tenant.state})` : 'Nacional'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            tenant.isActive
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {tenant.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenEdit(tenant)}
                          className="h-8 w-8 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-850"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            toggleStatusMutation.mutate({ id: tenant.id, isActive: !tenant.isActive })
                          }
                          className={`h-8 w-8 border-zinc-800 hover:bg-zinc-850 ${
                            tenant.isActive ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-350'
                          }`}
                        >
                          {tenant.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
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
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {editingTenant ? 'Editar Gabinete' : 'Cadastrar Novo Gabinete'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Preencha os metadados do candidato político. O backend gerará automaticamente o isolamento de tenant.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-350">Nome do Candidato / Gabinete</Label>
                <Input
                  id="name"
                  placeholder="Ex: João Silva da Saúde"
                  className="bg-zinc-950/60 border-zinc-800 text-white"
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-zinc-350">Slug de Acesso (URL)</Label>
                <Input
                  id="slug"
                  placeholder="joao-silva"
                  className="bg-zinc-950/60 border-zinc-800 text-white font-mono"
                  {...register('slug')}
                />
                {errors.slug && <p className="text-xs text-red-400">{errors.slug.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document" className="text-zinc-350">CPF / CNPJ do Candidato</Label>
                <Input
                  id="document"
                  placeholder="Apenas números"
                  className="bg-zinc-950/60 border-zinc-800 text-white"
                  {...register('document')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-350">E-mail Oficial</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="candidato@campanha.com.br"
                  className="bg-zinc-950/60 border-zinc-800 text-white"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="party" className="text-zinc-350">Partido Político</Label>
                <Input
                  id="party"
                  placeholder="Ex: PL, PT, PSD, MDB"
                  className="bg-zinc-950/60 border-zinc-800 text-white"
                  {...register('party')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-zinc-350">Cargo Pleiteado</Label>
                <Input
                  id="position"
                  placeholder="Ex: Vereador, Prefeito, Deputado"
                  className="bg-zinc-950/60 border-zinc-800 text-white"
                  {...register('position')}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label htmlFor="state" className="text-zinc-350">UF</Label>
                <Input
                  id="state"
                  placeholder="SP"
                  maxLength={2}
                  className="bg-zinc-950/60 border-zinc-800 text-white uppercase"
                  {...register('state')}
                />
                {errors.state && <p className="text-xs text-red-400">{errors.state.message}</p>}
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="city" className="text-zinc-350">Cidade Base</Label>
                <Input
                  id="city"
                  placeholder="Ex: Campinas"
                  className="bg-zinc-950/60 border-zinc-800 text-white"
                  {...register('city')}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-650 hover:bg-indigo-750 text-white"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar Gabinete'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
