'use client';

/**
 * LAYOUT ADMINISTRATIVO — BLACK CAT NAILS WEB (BCN-12)
 *
 * Estructura de navegación para la administradora:
 * - Sidebar lateral con enlaces: Dashboard, Agenda, Clientas, Servicios, Inventario, Reportes.
 * - Perfil de la usuaria y botón de cerrar sesión.
 * - Sidebar colapsable (drawer deslizable) en pantallas menores a 768 px.
 *
 * Basado en los mockups de Figma (Figura 5 / nodo 31:4 y 19:150).
 */

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Sparkles,
  Package,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface NavItem {
  nombre: string;
  href: string;
  icono: React.ComponentType<{ className?: string }>;
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { nombre: 'Dashboard', href: '/admin', icono: LayoutDashboard },
  { nombre: 'Agenda', href: '/admin/agenda', icono: Calendar },
  { nombre: 'Clientas', href: '/admin/clientas', icono: Users },
  { nombre: 'Servicios', href: '/admin/servicios', icono: Sparkles },
  { nombre: 'Inventario', href: '/admin/inventario', icono: Package },
  { nombre: 'Reportes', href: '/admin/reportes', icono: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { usuaria, logout } = useAuth();
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  const esRutaActiva = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const cerrarMenu = () => setSidebarAbierto(false);

  const handleLogout = async () => {
    cerrarMenu();
    await logout();
  };

  // Contenido interno del sidebar reutilizado en desktop y mobile drawer
  const ContenidoSidebar = (
    <div className="flex flex-col justify-between h-full p-4 sm:p-5">
      {/* Top: Logo y navegación */}
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="relative size-9 shrink-0">
            <Image
              src="/logo.svg"
              alt="Black Cat Nails Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-serif text-lg font-bold text-white tracking-tight">
            Black Cat Nails
          </span>
        </div>

        {/* Lista de navegación */}
        <nav className="space-y-1.5" aria-label="Navegación administrativa">
          {ADMIN_NAV_ITEMS.map((item) => {
            const activo = esRutaActiva(item.href);
            const Icono = item.icono;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={cerrarMenu}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-sm font-medium transition-colors ${
                  activo
                    ? 'bg-[var(--primary)] text-white font-semibold shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icono className={`size-4 ${activo ? 'text-white' : 'text-[var(--accent)]'}`} />
                <span>{item.nombre}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Perfil de usuaria y logout */}
      <div className="border-t border-white/10 pt-4 space-y-3">
        <div className="px-2">
          <p className="text-sm font-semibold text-white truncate">
            {usuaria?.nombre || 'Administradora'}
          </p>
          <p className="text-xs text-[var(--accent)] font-medium">
            Administradora
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2.5 text-white/70 hover:text-white hover:bg-red-950/30 text-xs px-2.5 py-2 h-auto rounded-[10px]"
        >
          <LogOut className="size-4 text-red-400" />
          <span>Cerrar sesión</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-foreground flex flex-col md:flex-row">
      {/* 1. Header superior en pantallas móviles (< 768 px) */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarAbierto(true)}
            className="p-1.5 h-auto rounded-[10px]"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="size-5 text-white" />
          </Button>
          <span className="font-serif font-bold text-white text-base tracking-tight">
            Black Cat Nails
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70 truncate max-w-[120px]">
            {usuaria?.nombre?.split(' ')[0] || 'Admin'}
          </span>
          <Button
            variant="ghost"
            size="xs"
            onClick={handleLogout}
            className="p-1.5 h-auto text-red-400"
            title="Cerrar sesión"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      {/* 2. Sidebar fijo en pantallas de escritorio (>= 768 px) */}
      <aside className="hidden md:block w-60 shrink-0 border-r border-white/10 bg-card/40 backdrop-blur min-h-screen sticky top-0 h-screen">
        {ContenidoSidebar}
      </aside>

      {/* 3. Drawer colapsable para móviles (< 768 px) */}
      {sidebarAbierto && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={cerrarMenu}
            aria-hidden="true"
          />

          {/* Panel lateral deslizable */}
          <div className="relative w-64 max-w-[80%] bg-[#1A1209] border-r border-white/10 z-50 flex flex-col h-full shadow-2xl">
            {/* Botón cerrar */}
            <div className="absolute top-3 right-3 z-10">
              <Button
                variant="ghost"
                size="xs"
                onClick={cerrarMenu}
                className="p-1.5 h-auto text-white/70 hover:text-white"
                aria-label="Cerrar menú"
              >
                <X className="size-5" />
              </Button>
            </div>

            {ContenidoSidebar}
          </div>
        </div>
      )}

      {/* 4. Área de contenido principal */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
