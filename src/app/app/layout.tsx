'use client';

/**
 * LAYOUT DE LA CLIENTA — BLACK CAT NAILS WEB (BCN-12)
 *
 * Estructura de navegación para clientas:
 * - Navegación entre: Inicio (/app), Agendar (/app/agendar), Mis citas (/app/citas), Perfil (/app/perfil).
 * - Escritorio: Barra superior con marca, enlaces con píldora activa, perfil y botón de cerrar sesión.
 * - Móviles (< 768 px): Barra superior compacta + Bottom Tab Bar fija inferior (según mockup Figma 5:114).
 * - Contenido centrado a un máximo de 720 px según especificación 05-ui-y-rutas.md.
 */

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CalendarPlus,
  Calendar,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface ClientaNavItem {
  nombre: string;
  href: string;
  icono: React.ComponentType<{ className?: string }>;
}

const CLIENTA_NAV_ITEMS: ClientaNavItem[] = [
  { nombre: 'Inicio', href: '/app', icono: Home },
  { nombre: 'Agendar', href: '/app/agendar', icono: CalendarPlus },
  { nombre: 'Mis citas', href: '/app/citas', icono: Calendar },
  { nombre: 'Perfil', href: '/app/perfil', icono: User },
];

export default function ClientaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { usuaria, logout } = useAuth();

  const esRutaActiva = (href: string) => {
    if (href === '/app') {
      return pathname === '/app';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-foreground flex flex-col">
      {/* 1. Barra de navegación superior (Desktop y Mobile Header) */}
      <header className="border-b border-white/10 bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo y marca */}
          <Link href="/app" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="relative size-8 shrink-0">
              <Image
                src="/logo.svg"
                alt="Logo de Black Cat Nails"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-serif font-bold text-white text-base sm:text-lg tracking-tight">
              Black Cat Nails
            </span>
          </Link>

          {/* Navegación central en escritorio (>= 768 px) */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navegación clienta">
            {CLIENTA_NAV_ITEMS.map((item) => {
              const activo = esRutaActiva(item.href);
              const Icono = item.icono;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    activo
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icono className="size-3.5" />
                  <span>{item.nombre}</span>
                </Link>
              );
            })}
          </nav>

          {/* Perfil y logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white truncate max-w-[140px]">
                {usuaria?.nombre || 'Clienta'}
              </p>
            </div>

            <Button
              variant="outline"
              size="xs"
              onClick={() => logout()}
              className="gap-1.5 text-xs text-white/80 hover:text-white border-white/20"
              title="Cerrar sesión"
            >
              <LogOut className="size-3.5 text-red-400" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Contenido principal centrado a máximo 720 px */}
      <main className="flex-1 max-w-[720px] w-full mx-auto px-4 py-6 md:py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* 3. Bottom Tab Bar para móviles (< 768 px) — Fiel a Figma (nodo 5:114) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 bg-[#1A1209]/95 backdrop-blur border-t border-white/10 z-40 flex items-center justify-around py-2 px-3 shadow-2xl"
        aria-label="Navegación inferior móvil"
      >
        {CLIENTA_NAV_ITEMS.map((item) => {
          const activo = esRutaActiva(item.href);
          const Icono = item.icono;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-[12px] transition-colors ${
                activo ? 'text-[var(--primary)] font-semibold' : 'text-white/60 hover:text-white'
              }`}
            >
              <Icono className={`size-5 ${activo ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] leading-none">{item.nombre}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
