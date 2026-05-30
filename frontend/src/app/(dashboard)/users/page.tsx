'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { api } from '../../../lib/api';
import { useAuthStore, UserRole } from '../../../store/authStore';
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
  UserCheck,
  Plus,
  Search,
  UserPlus,
  Shield,
  Edit2,
  Lock,
  Unlock,
  KeyRound,
  Filter,
} from 'lucide-react';

const userFormSchema = zod.object({
  name: zod.string().min(3, { message: 'Mínimo de 3 caracteres' }),
  email: zod.string().email({ message: 'E-mail inválido' }),
  phone: zod.string().optional(),
  role: zod.string().min(1, { message: 'Selecione o perfil' }),
  password: zod.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres' }).optional().or(zod.literal('')),
  tenantId: zod.string().optional(),
});

type UserFormValues = zod.infer<typeof userFormSchema>;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isOpen, setIsOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedUserForReset, setSelectedUserForReset] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
  });

  // Busca lista de Usuários do backend
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users', searchTerm, roleFilter],
    queryFn: async () => {
      const params: any = { search: searchTerm, limit: 100 };
      if (roleFilter !== 'ALL') params.role = roleFilter;
      const res = await api.get('/users', { params });
      return res.data;
    },
  });

  const users = usersResponse?.data?.items || [];

  // Busca lista de Tenants (apenas se for ROOT para carregar select de Tenants no formulário)
  const { data: tenantsResponse } = useQuery({
    queryKey: ['tenants-list'],
    queryFn: async () => {
      const res = await api.get('/tenants', { params: { limit: 100 } });
      return res.data;
    },
    enabled: currentUser?.role === 'ROOT',
  });

  const tenants = tenantsResponse?.data?.items || [];

  // Define os perfis (roles) que o usuário atual tem permissão para cadastrar/editar (Hierarquia RBAC)
  const getAllowedRoles = (): { label: string; value: UserRole }[] => {
    if (!currentUser) return [];

    switch (currentUser.role) {
      case 'ROOT':
        return [
          { label: 'ROOT (Super Admin)', value: 'ROOT' },
          { label: 'Político / Candidato', value: 'POLITICO' },
          { label: 'Chefe de Gabinete', value: 'CHEFEGAB' },
          { label: 'Coordenador Regional', value: 'COORDENADOR' },
          { label: 'Líder Regional', value: 'LIDERREG' },
          { label: 'Líder Local', value: 'LIDERLOCAL' },
        ];
      case 'POLITICO':
        return [{ label: 'Chefe de Gabinete', value: 'CHEFEGAB' }];
      case 'CHEFEGAB':
        return [{ label: 'Coordenador Regional', value: 'COORDENADOR' }];
      case 'COORDENADOR':
        return [{ label: 'Líder Regional', value: 'LIDERREG' }];
      case 'LIDERREG':
        return [{ label: 'Líder Local', value: 'LIDERLOCAL' }];
      default:
        return [];
    }
  };

  const allowedRoles = getAllowedRoles();

  // Mutation de Criar/Editar
  const saveMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const payload: any = { ...data };

      // Se estiver editando, não enviamos a senha a menos que queira mudar
      if (editingUser) {
        if (!payload.password) delete payload.password;
        return api.put(`/users/${editingUser.id}`, payload);
      }

      return api.post('/users', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!');
      handleClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Não foi possível salvar os dados';
      toast.error('Erro ao salvar usuário', {
        description: Array.isArray(msg) ? msg[0] : msg,
      });
    },
  });

  // Mutation de Ativar/Desativar
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return api.put(`/users/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Status da conta atualizado!');
    },
    onError: () => {
      toast.error('Erro ao alterar status');
    },
  });

  // Mutation de Resetar Senha
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      return api.post(`/users/${id}/reset-password`, { password });
    },
    onSuccess: () => {
      toast.success('Senha redefinida com sucesso!', {
        description: 'Todas as sessões anteriores do usuário foram desconectadas.',
      });
      setIsResetOpen(false);
      setSelectedUserForReset(null);
      setNewPassword('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erro ao redefinir';
      toast.error('Erro ao redefinir senha', {
        description: Array.isArray(msg) ? msg[0] : msg,
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    reset({
      name: '',
      email: '',
      phone: '',
      role: allowedRoles[0]?.value || 'LIDERLOCAL',
      password: '',
      tenantId: currentUser?.tenantId || undefined,
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    reset({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '',
      tenantId: user.tenantId || undefined,
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingUser(null);
  };

  const handleOpenReset = (user: any) => {
    setSelectedUserForReset(user);
    setNewPassword('');
    setIsResetOpen(true);
  };

  const onSubmit = (data: UserFormValues) => {
    saveMutation.mutate(data);
  };

  const handleResetPassword = () => {
    if (newPassword.length < 6) {
      toast.error('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    resetPasswordMutation.mutate({
      id: selectedUserForReset.id,
      password: newPassword,
    });
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Equipe e Lideranças</h1>
          <p className="text-zinc-400">
            Cadastre assessores, coordenadores regionais e lideranças de campo para captação de eleitores.
          </p>
        </div>
        {allowedRoles.length > 0 && (
          <Button
            onClick={handleOpenCreate}
            className="bg-indigo-650 hover:bg-indigo-750 text-white font-medium gap-1.5 transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar Membro
          </Button>
        )}
      </div>

      {/* Filtros da Listagem */}
      <Card className="bg-zinc-900/40 border-zinc-800/80 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
            <Input
              placeholder="Buscar equipe por nome, e-mail ou telefone..."
              className="pl-10 bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-550 focus-visible:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-56 flex gap-2 items-center">
            <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
            <Select value={roleFilter} onValueChange={(val: any) => setRoleFilter(val || 'ALL')}>
              <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-zinc-300">
                <SelectValue placeholder="Filtrar por Perfil" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                <SelectItem value="ALL" className="focus:bg-zinc-800 focus:text-white">Todos os Perfis</SelectItem>
                <SelectItem value="ROOT" className="focus:bg-zinc-800 focus:text-white">ROOT</SelectItem>
                <SelectItem value="POLITICO" className="focus:bg-zinc-800 focus:text-white">Político / Candidato</SelectItem>
                <SelectItem value="CHEFEGAB" className="focus:bg-zinc-800 focus:text-white">Chefe de Gabinete</SelectItem>
                <SelectItem value="COORDENADOR" className="focus:bg-zinc-800 focus:text-white">Coordenador Regional</SelectItem>
                <SelectItem value="LIDERREG" className="focus:bg-zinc-800 focus:text-white">Líder Regional</SelectItem>
                <SelectItem value="LIDERLOCAL" className="focus:bg-zinc-800 focus:text-white">Líder Local</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Membros Cadastrados</CardTitle>
          <CardDescription className="text-zinc-400">
            Histórico e controle de acessos da equipe do gabinete político.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full bg-zinc-850" />
              <Skeleton className="h-10 w-full bg-zinc-850" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-650">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-white">Nenhum membro encontrado</h3>
              <p className="text-sm text-zinc-500">
                Adicione lideranças para compor o seu painel de captação eleitoral.
              </p>
            </div>
          ) : (
            <div className="relative overflow-x-auto border border-zinc-800/80 rounded-lg">
              <table className="w-full text-sm text-left text-zinc-300">
                <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/60 border-b border-zinc-800">
                  <tr>
                    <th scope="col" className="px-6 py-4">Membro</th>
                    <th scope="col" className="px-6 py-4">Perfil (Nível)</th>
                    <th scope="col" className="px-6 py-4">Gabinete / Tenant</th>
                    <th scope="col" className="px-6 py-4">Telefone</th>
                    <th scope="col" className="px-6 py-4 text-center">Status</th>
                    <th scope="col" className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-900/10">
                  {users.map((item: any) => (
                    <tr key={item.id} className="hover:bg-zinc-850/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">
                        <div className="flex flex-col">
                          <span>{item.name}</span>
                          <span className="text-xs font-normal text-zinc-500">{item.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-400 font-semibold uppercase bg-indigo-500/5 px-2.5 py-1 rounded-md border border-indigo-500/10">
                          <Shield className="w-3.5 h-3.5" />
                          {item.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {item.tenant?.name || 'Global (ROOT)'}
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-450">{item.phone || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            item.isActive
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {item.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenEdit(item)}
                          className="h-8 w-8 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-850"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenReset(item)}
                          title="Resetar Senha"
                          className="h-8 w-8 text-amber-400 border-zinc-800 hover:text-amber-300 hover:bg-zinc-850"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            toggleStatusMutation.mutate({ id: item.id, isActive: !item.isActive })
                          }
                          className={`h-8 w-8 border-zinc-800 hover:bg-zinc-850 ${
                            item.isActive ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-350'
                          }`}
                        >
                          {item.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
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
              {editingUser ? 'Editar Usuário' : 'Cadastrar Membro na Equipe'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Crie contas de equipe. A visibilidade e criação respeitam estritamente a árvore de hierarquia RBAC.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-350">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Nome do operador"
                  className="bg-zinc-950/60 border-zinc-800 text-white"
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-350">E-mail (Acesso)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@campanha.com.br"
                  className="bg-zinc-950/60 border-zinc-800 text-white"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-zinc-350">WhatsApp / Telefone</Label>
                <Input
                  id="phone"
                  placeholder="Ex: 19999887766"
                  className="bg-zinc-950/60 border-zinc-800 text-white font-mono"
                  {...register('phone')}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-350">Perfil de Acesso (RBAC)</Label>
                <Select
                  defaultValue={allowedRoles[0]?.value || 'LIDERLOCAL'}
                  onValueChange={(val: any) => setValue('role', val || 'LIDERLOCAL')}
                >
                  <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-300">
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                    {allowedRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value} className="focus:bg-zinc-800 focus:text-white">
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}
              </div>
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-350">Senha Inicial</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="bg-zinc-950/60 border-zinc-800 text-white"
                  {...register('password')}
                />
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>
            )}

            {/* Seleção de Tenant (Apenas para ROOT cadastrar usuários) */}
            {currentUser?.role === 'ROOT' && (
              <div className="space-y-2">
                <Label className="text-zinc-350">Vincular ao Gabinete (Tenant)</Label>
                <Select
                  onValueChange={(val: any) => setValue('tenantId', !val || val === 'GLOBAL' ? undefined : val)}
                >
                  <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-300">
                    <SelectValue placeholder="Selecione o candidato" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                    <SelectItem value="GLOBAL" className="focus:bg-zinc-800 focus:text-white">Global (Sem Tenant/ROOT)</SelectItem>
                    {tenants.map((t: any) => (
                      <SelectItem key={t.id} value={t.id} className="focus:bg-zinc-800 focus:text-white">
                        {t.name} ({t.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                {saveMutation.isPending ? 'Salvando...' : 'Salvar Membro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Reset Password */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-1.5">
              <KeyRound className="w-5 h-5 text-amber-400" />
              Redefinir Senha
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Altere a senha de acesso do usuário **{selectedUserForReset?.name}**.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-zinc-350">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                className="bg-zinc-950/60 border-zinc-800 text-white"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResetOpen(false)}
                className="border-zinc-800 text-zinc-400 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleResetPassword}
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? 'Redefinindo...' : 'Alterar Senha'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
