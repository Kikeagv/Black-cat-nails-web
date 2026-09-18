'use client';

/**
 * INICIO Y CATÁLOGO DE LA CLIENTA — BLACK CAT NAILS WEB (BCN-16)
 *
 * Pantalla principal de la clienta (/app) basada en la Figura 1 (adaptada a escritorio):
 * - Tarjeta destacada superior de próxima cita (con fecha, servicios y badge de estado).
 * - Estado vacío amigable cuando la clienta no tiene citas pendientes, invitándola a agendar.
 * - Catálogo completo de servicios activos con duración, precio y categoría.
 * - Botón de "Agendar" visible de manera clara y accesible en ambas secciones.
 * - Filtros rápidos por categoría de servicio.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CalendarPlus,
  Clock,
  Sparkles,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCatalogo } from '@/context/CatalogoContext';
import { useAgenda } from '@/context/AgendaContext';
import { EstadoCita } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const LABELS_ESTADO: Record<EstadoCita, string> = {
  solicitada: 'Solicitada',
  confirmada: 'Confirmada',
  en_curso: 'En curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
  inasistencia: 'Inasistencia',
};

function formatearFechaCita(isoString: string): string {
  try {
    const date = new Date(isoString);
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const diaSem = dias[date.getDay()];
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const horas = date.getHours().toString().padStart(2, '0');
    const minutos = date.getMinutes().toString().padStart(2, '0');
    return `${diaSem} ${dia} ${mes} · ${horas}:${minutos}`;
  } catch {
    return isoString;
  }
}

export default function ClientaAppPage() {
  const { usuaria } = useAuth();
  const { servicios, cargando: cargandoCatalogo } = useCatalogo();

  const { citas, cargando: cargandoCitas } = useAgenda();
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');

  // Próxima cita activa de la clienta obtenida reactivamente del AgendaContext
  const proximaCita = useMemo(() => {
    const activas = citas.filter(
      (c) =>
        c.estado === 'solicitada' ||
        c.estado === 'confirmada' ||
        c.estado === 'en_curso'
    );
    activas.sort((a, b) => a.inicio.localeCompare(b.inicio));
    return activas.length > 0 ? activas[0] : null;
  }, [citas]);

  // Servicios activos en el catálogo
  const serviciosActivos = useMemo(() => {
    return servicios.filter((s) => s.activo);
  }, [servicios]);

  // Categorías presentes en los servicios activos
  const categorias = useMemo(() => {
    const set = new Set(serviciosActivos.map((s) => s.categoria));
    return ['todas', ...Array.from(set)];
  }, [serviciosActivos]);

  // Filtrado de servicios por categoría seleccionada
  const serviciosFiltrados = useMemo(() => {
    if (categoriaSeleccionada === 'todas') {
      return serviciosActivos;
    }
    return serviciosActivos.filter((s) => s.categoria === categoriaSeleccionada);
  }, [serviciosActivos, categoriaSeleccionada]);

  const primerNombre = usuaria?.nombre?.split(' ')[0] || 'Clienta';

  return (
    <div className="space-y-8">
      {/* 1. Saludo y Encabezado */}
      <div className="space-y-1">
        <h1 className="text-display-32 font-serif text-white tracking-tight">
          ¡Hola, {primerNombre}!
        </h1>
        <p className="text-sm text-[var(--accent)]">
          ¿Qué diseño creamos hoy?
        </p>
      </div>

      {/* 2. Sección Superior: Tarjeta de Próxima Cita / Estado Vacío (Figma 5:52) */}
      <section aria-label="Próxima cita">
        {cargandoCitas ? (
          <div className="h-40 rounded-[16px] bg-white/5 border border-white/10 animate-pulse flex flex-col justify-between p-5">
            <div className="h-4 bg-white/10 rounded w-1/3" />
            <div className="space-y-2">
              <div className="h-6 bg-white/10 rounded w-1/2" />
              <div className="h-4 bg-white/10 rounded w-2/3" />
            </div>
            <div className="h-8 bg-white/10 rounded w-1/4" />
          </div>
        ) : proximaCita ? (
          /* Tarjeta Destacada con Cita Activa */
          <Card
            variant="surface"
            className="p-5 flex flex-col justify-between min-h-[160px] shadow-xl rounded-[16px] relative overflow-hidden group"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/90">
                <Calendar className="size-4" />
                <span>Tu próxima cita</span>
              </div>
              <Badge variant={proximaCita.estado}>
                {LABELS_ESTADO[proximaCita.estado]}
              </Badge>
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-display-24 text-white font-serif">
                {formatearFechaCita(proximaCita.inicio)}
              </p>
              <p className="text-sm text-white/90 font-medium">
                {proximaCita.servicios.map((s) => s.nombre).join(' + ')}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-white/20 flex items-center justify-between gap-3">
              <div className="text-xs text-white/80">
                <span>Total: </span>
                <strong className="text-white font-bold">
                  ${proximaCita.montoTotal.toFixed(2)}
                </strong>
                <span className="text-white/60">
                  {' '}
                  ({proximaCita.duracionTotalMin} min)
                </span>
              </div>

              {/* Botón de agendar visible en esta sección */}
              <div className="flex items-center gap-2">
                <Link href="/app/agendar">
                  <Button
                    size="sm"
                    className="text-xs gap-1.5 bg-white text-[#B4476E] hover:bg-white/90 font-semibold shadow"
                  >
                    <CalendarPlus className="size-3.5" />
                    <span>Agendar otra cita</span>
                  </Button>
                </Link>
                <Link href="/app/citas">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-white/30 text-white hover:bg-white/15 bg-transparent"
                  >
                    Ver detalles
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          /* Estado Vacío: Clienta sin citas agendadas */
          <Card
            variant="surface"
            className="p-6 rounded-[16px] shadow-xl border border-white/10 space-y-4"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/90">
              <Calendar className="size-4" />
              <span>Tu próxima cita</span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-display-24 font-serif text-white">
                Aún no tenés citas programadas
              </h3>
              <p className="text-sm text-white/85 leading-relaxed max-w-lg">
                Elegí tu diseño favorito del catálogo y reservá tu horario en solo 3
                simples pasos.
              </p>
            </div>

            {/* Botón de agendar visible en sección de próxima cita vacía */}
            <div className="pt-2">
              <Link href="/app/agendar" className="inline-block">
                <Button
                  size="lg"
                  className="gap-2 bg-white text-[#B4476E] hover:bg-white/90 font-semibold shadow-md text-sm px-6 h-11"
                >
                  <CalendarPlus className="size-4" />
                  <span>Agendar cita ahora</span>
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </section>

      {/* 3. Sección Inferior: Catálogo de Servicios Disponibles (Figma 5:65) */}
      <section aria-label="Catálogo de servicios" className="space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-xl font-serif text-white font-semibold">
              Servicios Disponibles
            </h2>
            <p className="text-xs text-[var(--accent)]">
              Seleccioná un servicio para tu próxima visita
            </p>
          </div>

          {/* Botón de agendar visible en la sección de catálogo */}
          <Link href="/app/agendar">
            <Button
              size="sm"
              className="text-xs gap-1.5 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 shadow"
            >
              <CalendarPlus className="size-3.5" />
              <span>Agendar cita</span>
            </Button>
          </Link>
        </div>

        {/* Filtros rápidos por categoría */}
        {categorias.length > 2 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categorias.map((cat) => {
              const activa = categoriaSeleccionada === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoriaSeleccionada(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap capitalize ${
                    activa
                      ? 'bg-[var(--primary)] text-white font-semibold shadow-sm'
                      : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
                  }`}
                >
                  {cat === 'todas' ? 'Todos' : cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Lista de servicios activos */}
        {cargandoCatalogo ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-[16px] bg-card border border-white/10 animate-pulse flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3 w-2/3">
                  <div className="size-12 rounded-[12px] bg-white/10" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                  </div>
                </div>
                <div className="size-8 bg-white/10 rounded-full" />
              </div>
            ))}
          </div>
        ) : serviciosFiltrados.length === 0 ? (
          <Card className="p-8 text-center rounded-[16px] border border-white/10 bg-card/40 space-y-2">
            <p className="text-sm text-white/80">
              No hay servicios disponibles en esta categoría por el momento.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCategoriaSeleccionada('todas')}
              className="text-xs border-white/20 text-white"
            >
              Ver todos los servicios
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {serviciosFiltrados.map((servicio) => (
              <Link
                key={servicio.id}
                href={`/app/agendar?servicioId=${servicio.id}`}
                className="block group"
              >
                <Card className="p-4 flex items-center justify-between gap-4 bg-card rounded-[16px] border border-white/10 hover:border-[var(--accent)]/50 transition-all hover:bg-card/80 cursor-pointer shadow-sm">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Icono de servicio */}
                    <div className="size-12 sm:size-14 rounded-[12px] bg-[#2E2218] border border-white/10 flex items-center justify-center shrink-0 text-[var(--primary)] group-hover:scale-105 transition-transform">
                      <Sparkles className="size-6" />
                    </div>

                    {/* Datos del servicio */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[15px] text-white truncate group-hover:text-[var(--primary)] transition-colors">
                          {servicio.nombre}
                        </h3>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-white/10 text-white/70">
                          {servicio.categoria}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 text-white/50" />
                          <span>{servicio.duracionMin} min</span>
                        </span>
                        <span>•</span>
                        <span className="text-[var(--primary)] font-bold text-sm">
                          ${servicio.precio.toFixed(2)}
                        </span>
                        {servicio.cicloRetornoDias > 0 && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline text-white/50 text-[11px]">
                              Retoque c/{servicio.cicloRetornoDias}d
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acción rápida */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs text-[var(--accent)] font-medium group-hover:translate-x-0.5 transition-transform">
                      <span>Agendar</span>
                      <ArrowRight className="size-3.5" />
                    </span>
                    <ChevronRight className="size-5 text-[var(--accent)] group-hover:translate-x-1 transition-transform sm:hidden" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. Sección: Diseños Destacados (Figma nodo 5:101) */}
      <section aria-label="Diseños destacados" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif text-white font-semibold">
            Diseños destacados
          </h2>
          <Link
            href="/app/agendar"
            className="text-xs font-semibold text-[var(--accent)] hover:text-white transition-colors"
          >
            Ver todos
          </Link>
        </div>

        {/* Carrusel / galería horizontal de diseños */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {[
            {
              id: 'd1',
              titulo: 'Velvet Cat Eye',
              sub: 'Acrílico + Brillo magnético',
              gradiente: 'from-[#4a1c36] via-[#2d1b28] to-[#1a1209]',
              badge: 'Tendencia',
            },
            {
              id: 'd2',
              titulo: 'French Clásico',
              sub: 'Semipermanente blanco puro',
              gradiente: 'from-[#2e2640] via-[#1f1a2e] to-[#1a1209]',
              badge: 'Elegante',
            },
            {
              id: 'd3',
              titulo: 'Chrome Rose',
              sub: 'Efecto espejo oro rosa',
              gradiente: 'from-[#522938] via-[#331c26] to-[#1a1209]',
              badge: 'Popular',
            },
            {
              id: 'd4',
              titulo: 'Nail Art Pastel',
              sub: 'Diseño artístico mano alzada',
              gradiente: 'from-[#3a294d] via-[#231b33] to-[#1a1209]',
              badge: 'Artístico',
            },
          ].map((item) => (
            <Link
              key={item.id}
              href="/app/agendar"
              className="group shrink-0"
            >
              <div
                className={`size-[108px] sm:size-[120px] rounded-[12px] border border-white/10 bg-gradient-to-br ${item.gradiente} p-3 flex flex-col justify-between hover:border-[var(--primary)] hover:scale-[1.03] transition-all shadow-md relative overflow-hidden`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-white/15 text-white/90">
                    {item.badge}
                  </span>
                  <Sparkles className="size-3 text-[var(--primary)] group-hover:rotate-12 transition-transform" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white leading-tight truncate">
                    {item.titulo}
                  </p>
                  <p className="text-[10px] text-white/60 leading-tight truncate">
                    {item.sub}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
