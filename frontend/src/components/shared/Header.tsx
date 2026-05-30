'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useLayoutStore } from '../../store/layoutStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { Sun, Moon, Bell, LogOut, User, ShieldCheck } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const { theme, toggleTheme } = useLayoutStore();

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  // Divide o pathname em partes para os Breadcrumbs dinâmicos
  const pathParts = pathname.split('/').filter(Boolean);

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0">
      {/* Breadcrumbs Dinâmicos */}
      <div className="flex items-center gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={user?.role === 'ROOT' ? '/dashboard/root' : '/dashboard/tenant'}>
                Início
              </BreadcrumbLink>
            </BreadcrumbItem>
            {pathParts.length > 0 && <BreadcrumbSeparator />}
            {pathParts.map((part, index) => {
              const isLast = index === pathParts.length - 1;
              const href = '/' + pathParts.slice(0, index + 1).join('/');
              const label = part.charAt(0).toUpperCase() + part.slice(1);

              return (
                <div key={part} className="flex items-center gap-2">
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="text-white font-medium">{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Ações Rápidas & Menu do Usuário */}
      <div className="flex items-center gap-4">
        {/* Toggle de Tema Light/Dark */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer hover:bg-zinc-900 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Notificações Sino */}
        <div className="relative">
          <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer hover:bg-zinc-900 transition-colors">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          </button>
        </div>

        <div className="h-6 w-px bg-zinc-800" />

        {/* Menu Suspenso Perfil */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 outline-none cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs shadow-md border border-zinc-850 shadow-indigo-550/10 group-hover:scale-102 transition-transform">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-white truncate max-w-28 leading-none">
                  {user.name}
                </span>
                <span className="text-[10px] text-zinc-400 truncate max-w-28 mt-0.5">
                  {user.role}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-zinc-300">
              <DropdownMenuLabel className="text-white">Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer gap-2">
                <User className="w-4 h-4" />
                Meu Perfil
              </DropdownMenuItem>
              {user.role === 'ROOT' && (
                <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Painel de Suporte
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="focus:bg-red-500/10 focus:text-red-400 cursor-pointer gap-2 text-red-500"
              >
                <LogOut className="w-4 h-4" />
                Sair do Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
