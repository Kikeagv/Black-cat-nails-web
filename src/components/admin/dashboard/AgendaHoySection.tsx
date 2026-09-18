'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { CitaAgendaHoy, EstadoCita } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AgendaHoySectionProps {
  citas?: CitaAgendaHoy[];
  cargando?: boolean;
  error?: string | null;
  onReintentar?: () => void;
}

const ETIQUETA_ESTADO: Record<EstadoCita, string> = {
  solicitada: 'Solicitada',
  confirmada: 'Confirmada',
  en_curso: 'En curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
  inasistencia: 'Inasistencia',
};

export function AgendaHoySection({
  citas = [],
  cargando = false,
  error = null,
  onReintentar,
}: AgendaHoySectionProps) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-card/60 backdrop-blur p-6 space-y-5 flex flex-col justify-between">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-2 border-b border-white/8 pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-[var(--primary)]" />
          <h2 className="font-serif text-lg font-bold text-white">
            Agenda de hoy
          </h2>
          {!cargando && !error && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70 font-medium">
              {citas.length} {citas.length === 1 ? 'cita' : 'citas'}
            </span>
          )}
        </div>

        <Link
          href="/admin/agenda"
          className="text-xs sm:text-sm font-medium text-[var(--petal-pink)] hover:text-white transition-colors flex items-center gap-1 group"
        >
          <span>Ver agenda completa</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Contenido: Esqueleto de carga, Error por bloque o Timeline */}
      {cargando ? (
        <div className="space-y-3 pt-2 animate-pulse" aria-label="Cargando agenda de hoy...">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-[12px] border border-white/8 bg-white/2"
            >
              <div className="h-4 w-12 bg-white/10 rounded-md shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 bg-white/10 rounded-md" />
                <div className="h-3 w-48 bg-white/10 rounded-md" />
              </div>
              <div className="h-6 w-20 bg-white/10 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-8 px-4 rounded-[12px] border border-red-500/20 bg-red-500/5 text-center space-y-3">
          <AlertCircle className="size-8 text-red-400 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">Error al cargar la agenda de hoy</p>
            <p className="text-xs text-red-200/70">{error}</p>
          </div>
          {onReintentar && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReintentar}
              className="rounded-xl border-white/10 text-xs gap-1.5 h-8 px-3"
            >
              <RefreshCw className="size-3" />
              <span>Reintentar</span>
            </Button>
          )}
        </div>
      ) : citas.length === 0 ? (
        <div className="py-10 px-4 rounded-[12px] border border-dashed border-white/10 bg-white/2 text-center space-y-3">
          <Clock className="size-8 text-white/30 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/80">
              No hay citas programadas para hoy
            </p>
            <p className="text-xs text-white/50">
              Revisa la disponibilidad semanal o agenda una nueva cita manualmente.
            </p>
          </div>
          <Link
            href="/admin/agenda"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline pt-1"
          >
            + Ir a la agenda semanal
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {citas.map((cita) => (
            <div
              key={cita.id}
              className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-[12px] border border-white/8 bg-white/2 hover:bg-white/4 hover:border-white/15 transition-all"
            >
              {/* Hora */}
              <div className="w-14 shrink-0 text-left">
                <span className="font-mono text-sm sm:text-base font-bold text-white">
                  {cita.hora}
                </span>
              </div>

              {/* Detalle de la cita */}
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-semibold text-white truncate">
                  {cita.clienta}
                </p>
                <p className="text-xs text-white/60 truncate">
                  {cita.servicios}
                </p>
              </div>

              {/* Insignia de estado */}
              <Badge variant={cita.estado} className="shrink-0 text-xs">
                {ETIQUETA_ESTADO[cita.estado] || cita.estado}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
