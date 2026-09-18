'use client';

import React, { useState } from 'react';
import { Clock, Sparkles, AlertCircle, CheckCircle2, User, Loader2 } from 'lucide-react';
import { Cita, EstadoCita } from '@/types';
import { ETIQUETAS_ESTADO } from '@/domain/estadosCita';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface CitaDetallePanelProps {
  cita: Cita | null;
  onCambiarEstado: (id: string, nuevoEstado: EstadoCita) => Promise<void>;
  cargandoAccion?: boolean;
}

const NOMBRES_DIAS_LARGO = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const NOMBRES_MESES_LARGO = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/**
 * Formatea una fecha y rango horario a texto legible en español (ej: "Martes 25 de agosto · 15:00 - 17:45").
 */
function formatearFechaHoraDetalle(inicioIso: string, finIso: string): string {
  try {
    const [fechaStr, horaIniFull] = inicioIso.split('T');
    const [, horaFinFull] = finIso.split('T');

    const [yyyy, mm, dd] = fechaStr.split('-').map(Number);
    const dateObj = new Date(Date.UTC(yyyy, mm - 1, dd, 12, 0, 0));

    const diaSemanaNombre = NOMBRES_DIAS_LARGO[dateObj.getUTCDay()];
    const mesNombre = NOMBRES_MESES_LARGO[mm - 1];

    const horaIni = (horaIniFull || '09:00').slice(0, 5);
    const horaFin = (horaFinFull || '10:00').slice(0, 5);

    return `${diaSemanaNombre} ${dd} de ${mesNombre} · ${horaIni} - ${horaFin}`;
  } catch {
    return `${inicioIso} - ${finIso}`;
  }
}

export function CitaDetallePanel({
  cita,
  onCambiarEstado,
  cargandoAccion = false,
}: CitaDetallePanelProps) {
  const [ejecutando, setEjecutando] = useState<string | null>(null);

  if (!cita) {
    return (
      <div className="bg-white/4 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center w-full lg:w-[360px] min-h-[400px] shrink-0">
        <div className="size-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-4">
          <Clock className="size-7" />
        </div>
        <h3 className="text-white font-serif font-bold text-lg mb-1">
          Detalle de la cita
        </h3>
        <p className="text-sm text-white/50 max-w-[240px]">
          Seleccioná cualquier cita de la agenda para consultar su información y gestionar su estado.
        </p>
      </div>
    );
  }

  const esFinalizada =
    cita.estado === 'completada' ||
    cita.estado === 'cancelada' ||
    cita.estado === 'inasistencia';

  const fechaHoraTexto = formatearFechaHoraDetalle(cita.inicio, cita.fin);
  const nombreClienta = cita.clientaNombre || 'Clienta';
  const inicial = nombreClienta.charAt(0).toUpperCase();

  const handleAccion = async (accion: 'completar' | 'inasistencia' | 'cancelar' | 'iniciar') => {
    if (ejecutando || cargandoAccion) return;

    try {
      setEjecutando(accion);

      if (accion === 'completar') {
        // Si está en 'solicitada' o 'confirmada', avanzar por la máquina de estados
        if (cita.estado === 'solicitada') {
          await onCambiarEstado(cita.id, 'confirmada');
          await onCambiarEstado(cita.id, 'en_curso');
        } else if (cita.estado === 'confirmada') {
          await onCambiarEstado(cita.id, 'en_curso');
        }
        await onCambiarEstado(cita.id, 'completada');
      } else if (accion === 'iniciar') {
        if (cita.estado === 'solicitada') {
          await onCambiarEstado(cita.id, 'confirmada');
        }
        await onCambiarEstado(cita.id, 'en_curso');
      } else if (accion === 'inasistencia') {
        await onCambiarEstado(cita.id, 'inasistencia');
      } else if (accion === 'cancelar') {
        await onCambiarEstado(cita.id, 'cancelada');
      }
    } finally {
      setEjecutando(null);
    }
  };

  return (
    <aside
      className="bg-white/4 border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col gap-5 w-full lg:w-[360px] shrink-0 shadow-lg"
      aria-label="Detalle de cita seleccionada"
    >
      {/* 1. Header con avatar, nombre y estado */}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="size-16 rounded-full border-2 border-[#E070C4] p-0.5 relative flex items-center justify-center bg-white/5 shadow-md">
          <div className="size-full rounded-full bg-[#B4476E]/30 flex items-center justify-center text-white font-serif font-bold text-xl">
            {inicial || <User className="size-6 text-white/80" />}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 w-full">
          <h2 className="font-serif text-xl font-bold text-white truncate max-w-full">
            {nombreClienta}
          </h2>
          <Badge variant={cita.estado} className="font-semibold text-xs px-2.5 py-1">
            {cita.estado === 'confirmada'
              ? 'Cita Confirmada'
              : ETIQUETAS_ESTADO[cita.estado] || cita.estado}
          </Badge>
        </div>
      </div>

      <div className="border-t border-white/10" />

      {/* 2. Lista de detalles: Fecha/Hora y Servicios */}
      <div className="flex flex-col gap-4">
        {/* Fecha y Hora */}
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent)] shrink-0 mt-0.5">
            <Clock className="size-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-white/40 font-medium">Fecha y Hora</span>
            <span className="text-sm font-semibold text-white leading-tight mt-0.5">
              {fechaHoraTexto}
            </span>
          </div>
        </div>

        {/* Servicios Solicitados */}
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#E070C4] shrink-0 mt-0.5">
            <Sparkles className="size-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-white/40 font-medium">
              Servicios solicitados
            </span>
            <span className="text-sm font-semibold text-white leading-tight mt-0.5">
              {cita.servicios.map((s) => s.nombre).join(' + ')}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10" />

      {/* 3. Desglose de servicios y montos */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase">
          Desglose de servicios
        </span>

        <div className="flex flex-col gap-2">
          {cita.servicios.map((srv, idx) => (
            <div
              key={`${srv.servicioId}-${idx}`}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-white/70 truncate pr-2">{srv.nombre}</span>
              <span className="text-white font-semibold shrink-0">
                ${srv.precio.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-2 flex items-center justify-between">
          <span className="text-sm font-bold text-white">Total estimado</span>
          <span className="font-serif text-xl font-bold text-[#E070C4]">
            ${cita.montoTotal.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="border-t border-white/10" />

      {/* 4. Notas de la clienta */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase">
          Notas de la clienta
        </span>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white/70 leading-relaxed min-h-[48px]">
          {cita.notas ? (
            <p className="italic">“{cita.notas}”</p>
          ) : (
            <span className="text-white/40">Sin notas adicionales proporcionadas</span>
          )}
        </div>
      </div>

      {/* 5. Acciones del estado */}
      <div className="flex flex-col gap-2.5 pt-1">
        {!esFinalizada ? (
          <>
            {cita.estado === 'confirmada' || cita.estado === 'en_curso' ? (
              <Button
                type="button"
                onClick={() => handleAccion('completar')}
                disabled={Boolean(ejecutando) || cargandoAccion}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm py-2.5 h-auto rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {ejecutando === 'completar' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4 text-emerald-400" />
                )}
                <span>Completar servicio</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => handleAccion('iniciar')}
                disabled={Boolean(ejecutando) || cargandoAccion}
                className="w-full bg-[#B4476E] hover:bg-[#B4476E]/90 text-white font-bold text-sm py-2.5 h-auto rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {ejecutando === 'iniciar' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4 text-white" />
                )}
                <span>Confirmar e Iniciar</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => handleAccion('inasistencia')}
              disabled={Boolean(ejecutando) || cargandoAccion}
              className="w-full border-rose-500/50 hover:border-rose-500 text-rose-400 hover:bg-rose-500/10 font-bold text-sm py-2.5 h-auto rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {ejecutando === 'inasistencia' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <AlertCircle className="size-4" />
              )}
              <span>Marcar inasistencia</span>
            </Button>

            <button
              type="button"
              onClick={() => handleAccion('cancelar')}
              disabled={Boolean(ejecutando) || cargandoAccion}
              className="w-full text-xs text-white/40 hover:text-white/80 py-1.5 transition-colors text-center cursor-pointer hover:underline disabled:opacity-50"
            >
              {ejecutando === 'cancelar' ? 'Cancelando...' : 'Cancelar cita'}
            </button>
          </>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
            <span className="text-xs text-white/60 font-medium">
              Esta cita ya fue finalizada ({cita.estado}).
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
