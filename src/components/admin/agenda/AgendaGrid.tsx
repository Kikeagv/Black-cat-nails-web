'use client';

import React from 'react';
import { Cita, EstadoCita } from '@/types';
import {
  DiaSemanaInfo,
  HORAS_GUTTER,
  ALTO_POR_HORA_PX,
  calcularPosicionCita,
} from '@/domain/agendaSemanal';

export interface AgendaGridProps {
  diasSemana: DiaSemanaInfo[];
  citas: Cita[];
  citaSeleccionadaId?: string | null;
  onSelectCita: (cita: Cita) => void;
  diaActivoFechaStr?: string;
}

/**
 * Retorna las clases de estilo de fondo, borde y texto según el estado de la cita.
 */
function obtenerEstiloCita(estado: EstadoCita, seleccionada: boolean): string {
  const base =
    'absolute left-1 right-1 rounded-[8px] border p-2 text-left transition-all z-20 cursor-pointer overflow-hidden leading-tight flex flex-col justify-between';

  const estiloSeleccion = seleccionada
    ? 'ring-2 ring-[#E070C4] ring-offset-1 ring-offset-[#1A1209] shadow-lg scale-[1.01]'
    : 'hover:scale-[1.01] hover:shadow-md';

  switch (estado) {
    case 'confirmada':
      return `${base} bg-[#E070C4]/15 border-[#E070C4]/40 text-[#E070C4] ${estiloSeleccion}`;
    case 'en_curso':
      return `${base} bg-[#B4476E]/25 border-[#E070C4] text-white shadow-md ${estiloSeleccion}`;
    case 'completada':
      return `${base} bg-emerald-500/15 border-emerald-500/35 text-emerald-200 ${estiloSeleccion}`;
    case 'solicitada':
      return `${base} bg-amber-500/15 border-amber-500/35 text-amber-200 ${estiloSeleccion}`;
    case 'cancelada':
      return `${base} bg-zinc-800/60 border-zinc-700/40 text-zinc-400 opacity-60 line-through ${estiloSeleccion}`;
    case 'inasistencia':
      return `${base} bg-rose-500/15 border-rose-500/35 text-rose-300 ${estiloSeleccion}`;
    default:
      return `${base} bg-white/10 border-white/20 text-white ${estiloSeleccion}`;
  }
}

export function AgendaGrid({
  diasSemana,
  citas,
  citaSeleccionadaId,
  onSelectCita,
  diaActivoFechaStr,
}: AgendaGridProps) {
  return (
    <div className="bg-white/4 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 overflow-x-auto min-w-0 w-full shadow-inner">
      <div className="min-w-[680px]">
        {/* Encabezado con los 7 días */}
        <div className="flex items-center gap-2 mb-3">
          {/* Espaciador del gutter de horas */}
          <div className="w-[50px] shrink-0" />

          {/* Columnas de cabecera de los días */}
          {diasSemana.map((dia) => {
            const esSeleccionado = diaActivoFechaStr === dia.fechaStr;
            const esHoy = dia.esHoy;

            return (
              <div
                key={dia.fechaStr}
                className={`flex-1 flex flex-col items-center py-2 px-1 rounded-lg transition-colors text-center ${
                  esSeleccionado || esHoy
                    ? 'bg-[#B4476E]/15 border border-[#B4476E]/40 text-[#E070C4]'
                    : 'text-white/40'
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {dia.claveDia}
                </span>
                <span
                  className={`font-serif text-lg sm:text-xl font-bold ${
                    esSeleccionado || esHoy ? 'text-white' : 'text-white/80'
                  }`}
                >
                  {dia.diaMes}
                </span>
              </div>
            );
          })}
        </div>

        {/* Cuerpo de la grilla (Horas + 7 Columnas) */}
        <div className="flex gap-2 relative h-[720px]">
          {/* Gutter de horas lateral */}
          <div className="w-[50px] shrink-0 flex flex-col text-right pr-2 select-none">
            {HORAS_GUTTER.map((hora) => (
              <div
                key={hora}
                style={{ height: `${ALTO_POR_HORA_PX}px` }}
                className="text-[11px] font-medium text-white/40 leading-none pt-0.5"
              >
                {hora}
              </div>
            ))}
          </div>

          {/* Las 7 columnas de días */}
          {diasSemana.map((dia) => {
            // Citas del día actual
            const citasDelDia = citas.filter((c) =>
              c.inicio.startsWith(dia.fechaStr)
            );

            return (
              <div
                key={dia.fechaStr}
                className="flex-1 relative h-full bg-white/[0.015] border border-white/[0.08] rounded-xl overflow-hidden"
              >
                {/* Líneas horizontales de cada hora */}
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                  {HORAS_GUTTER.map((h) => (
                    <div
                      key={h}
                      style={{ height: `${ALTO_POR_HORA_PX}px` }}
                      className="border-b border-white/[0.05] w-full"
                    />
                  ))}
                </div>

                {/* Bloques de fuera de horario */}
                {dia.fueraDeHorario.map((bloque, idx) => (
                  <div
                    key={`fh-${idx}`}
                    style={{
                      top: `${bloque.top}px`,
                      height: `${bloque.height}px`,
                    }}
                    className="absolute inset-x-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10 px-1 text-center"
                  >
                    <span className="text-[10px] sm:text-[11px] font-semibold text-white/30 uppercase tracking-wider select-none leading-tight">
                      {bloque.etiqueta}
                    </span>
                  </div>
                ))}

                {/* Bloques de Citas posicionadas de forma proporcional a la duración */}
                {citasDelDia.map((cita) => {
                  const { top, height, horaInicioStr, horaFinStr } =
                    calcularPosicionCita(cita.inicio, cita.duracionTotalMin);

                  const seleccionada = citaSeleccionadaId === cita.id;
                  const nombreClienta =
                    cita.clientaNombre || `Clienta (${cita.clientaId.slice(0, 5)})`;
                  const nombresServicios =
                    cita.servicios?.map((s) => s.nombre).join(' + ') ||
                    'Servicio estético';

                  return (
                    <button
                      key={cita.id}
                      type="button"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                      }}
                      onClick={() => onSelectCita(cita)}
                      className={obtenerEstiloCita(cita.estado, seleccionada)}
                      title={`${nombreClienta} · ${horaInicioStr} - ${horaFinStr} · ${nombresServicios}`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full shrink-0">
                        <span className="font-bold text-xs truncate max-w-[70%]">
                          {nombreClienta}
                        </span>
                        <span className="text-[10px] font-medium opacity-80 shrink-0">
                          {horaInicioStr}
                        </span>
                      </div>

                      {height >= 48 && (
                        <span className="text-[11px] font-medium text-white/90 truncate w-full mt-0.5">
                          {nombresServicios}
                        </span>
                      )}

                      {height >= 80 && (
                        <span className="text-[10px] text-white/60 opacity-80 mt-auto pt-1">
                          {horaInicioStr} - {horaFinStr} (${cita.montoTotal})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
