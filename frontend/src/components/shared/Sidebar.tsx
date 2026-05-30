'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, UserRole } from '../../store/authStore';
import { useLayoutStore } from '../../store/layoutStore';
import { cn } from '../../lib/utils';
import {
  Users,
  MapPin,
  Tag,
  FileBarChart2,
  FolderLock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  Globe2,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
  allowedRoles: UserRole[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  // Dashboard Geral
  {
    name: 'Dashboard',
    href: '/dashboard/tenant',
    icon: LayoutDashboard,
    allowedRoles: ['POLITICO', 'CHEFEGAB', 'COORDENADOR', 'LIDERREG', 'LIDERLOCAL'],
  },
  {
    name: 'Painel Global',
    href: '/dashboard/root',
    icon: ShieldCheck,
    allowedRoles: ['ROOT'],
  },
  // Cadastros e Gestão (Multi-tenant)
  {
    name: 'Eleitores',
    href: '/voters',
    icon: Users,
    allowedRoles: ['POLITICO', 'CHEFEGAB', 'COORDENADOR', 'LIDERREG', 'LIDERLOCAL'],
  },
  {
    name: 'Regiões',
    href: '/regions',
    icon: MapPin,
    allowedRoles: ['POLITICO', 'CHEFEGAB', 'COORDENADOR'],
  },
  {
    name: 'Segmentos',
    href: '/segments',
    icon: Tag,
    allowedRoles: ['POLITICO', 'CHEFEGAB', 'COORDENADOR', 'LIDERREG', 'LIDERLOCAL'],
  },
  {
    name: 'Gabinete & Equipe',
    href: '/users',
    icon: FolderLock,
    allowedRoles: ['POLITICO', 'CHEFEGAB', 'COORDENADOR', 'LIDERREG'],
  },
  // Apenas ROOT gerencia os Gabinetes (Tenants)
  {
    name: 'Gabinetes (Tenants)',
    href: '/tenants',
    icon: Globe2,
    allowedRoles: ['ROOT'],
  },
  // Relatórios
  {
    name: 'Relatórios',
    href: '/reports',
    icon: FileBarChart2,
    allowedRoles: ['ROOT', 'POLITICO', 'CHEFEGAB', 'COORDENADOR'],
  },
  // Auditoria
  {
    name: 'Histórico de Logs',
    href: '/audit',
    icon: FolderLock,
    allowedRoles: ['ROOT', 'POLITICO', 'CHEFEGAB'],
  },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const { isSidebarOpen, toggleSidebar } = useLayoutStore();

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  const filteredItems = SIDEBAR_ITEMS.filter(
    (item) => user && item.allowedRoles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        'relative bg-zinc-950 border-r border-zinc-800/80 flex flex-col transition-all duration-300 z-30 h-full',
        isSidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Top Header Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-850">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/10 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-base tracking-wide bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent truncate">
              CRM Político
            </span>
          )}
        </div>

        {/* Toggle Collapse Button Desktop */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex w-7 h-7 bg-zinc-900 border border-zinc-800 rounded-lg items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer hover:bg-zinc-850"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Perfil Simplificado na Sidebar */}
      {isSidebarOpen && user && (
        <div className="p-4 border-b border-zinc-850 bg-zinc-900/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-550 to-violet-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-550/10">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold text-sm text-white truncate">{user.name}</span>
            <span className="text-xs text-indigo-400 font-medium truncate">{user.role}</span>
          </div>
        </div>
      )}

      {/* Menu Itens */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer relative group',
                isActive
                  ? 'bg-indigo-550/10 text-indigo-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border-l-2 border-indigo-500 rounded-l-none pl-2.5'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              )}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-white')} />
              {isSidebarOpen ? (
                <span className="truncate">{item.name}</span>
              ) : (
                <span className="absolute left-16 bg-zinc-900 text-white border border-zinc-800 text-xs px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Bottom Logout */}
      <div className="p-3 border-t border-zinc-850">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer group"
        >
          <LogOut className="w-5 h-5 shrink-0 text-zinc-500 group-hover:text-red-400" />
          {isSidebarOpen && <span>Sair da Conta</span>}
        </button>
      </div>
    </aside>
  );
}
