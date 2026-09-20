'use client';

import { Cita, EstadoCita } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cumpleAnticipacionCancelacion } from '@/domain/estadosCita';
import {
  XCircle,
  Clock,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface CitaCardProps {
  cita: Cita;
  onSolicitarCancelar?: (cita: Cita) => void;
}

const MESES_ES = [
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

const ETIQUETA_ESTADO: Record<EstadoCita, string> = {
  solicitada: 'Solicitada',
  confirmada: 'Confirmada',
  en_curso: 'En curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
  inasistencia: 'Inasistencia',
};

export function CitaCard({ cita, onSolicitarCancelar }: CitaCardProps) {
  // Extraer partes de fecha de forma determinista para zona de El Salvador
  const diaNum = parseInt(cita.inicio.slice(8, 10), 10);
  const mesIndex = parseInt(cita.inicio.slice(5, 7), 10) - 1;
  const mesStr = MESES_ES[mesIndex] || '';
  const horaStr = cita.inicio.slice(11, 16);

  const nombresServicios =
    cita.servicios.length > 0
      ? cita.servicios.map((s) => s.nombre).join(' + ')
      : 'Servicio de uñas';

  const puedeCancelar = cumpleAnticipacionCancelacion(cita.inicio);
  const puedeGestionar = cita.estado === 'solicitada' || cita.estado === 'confirmada';

  return (
    <div className="rounded-[18px] border border-white/10 bg-card/50 backdrop-blur p-4 sm:p-5 transition-all hover:border-white/20 shadow-sm space-y-4">
      {/* Parte superior: Bloque de fecha, información del servicio e insignia */}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        {/* Bloque de fecha (Figma date-block) */}
        <div className="flex flex-col items-center justify-center size-14 sm:size-16 rounded-[14px] bg-white/5 border border-white/10 shrink-0 text-center select-none">
          <span className="text-xl sm:text-2xl font-bold font-serif text-white leading-none">
            {isNaN(diaNum) ? '--' : diaNum}
          </span>
          <span className="text-[11px] font-medium text-[var(--accent)] uppercase tracking-wider mt-0.5">
            {mesStr}
          </span>
        </div>

        {/* Información del servicio */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-white truncate max-w-[260px] sm:max-w-md">
              {nombresServicios}
            </h3>
            {/* Insignia de estado con colores oficiales */}
            <Badge variant={cita.estado} className="capitalize shrink-0">
              {ETIQUETA_ESTADO[cita.estado]}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white/70">
            <span className="flex items-center gap-1 font-medium text-white/90">
              <Clock className="size-3.5 text-[var(--accent)]" />
              {horaStr} hs
            </span>
            <span className="text-white/30">•</span>
            <span>{cita.duracionTotalMin} min</span>
            <span className="text-white/30">•</span>
            <span className="flex items-center text-white/90 font-medium">
              <DollarSign className="size-3.5 text-[var(--primary)] -mr-0.5" />
              {cita.montoTotal.toFixed(2)}
            </span>
          </div>

          {cita.notas && (
            <p className="text-xs text-white/60 italic line-clamp-1 pt-0.5">
              &ldquo;{cita.notas}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Acciones de la cita para citas próximas */}
      {puedeGestionar && (
        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          {/* Advertencia si faltan menos de 12 horas */}
          {!puedeCancelar ? (
            <p className="text-[11px] sm:text-xs text-amber-400/90 flex items-center gap-1.5 font-medium">
              <AlertCircle className="size-3.5 shrink-0" />
              Cancelación bloqueada: menos de 12 h de anticipación.
            </p>
          ) : (
            <span className="hidden sm:inline" />
          )}

          <div className="flex w-full items-center justify-end sm:w-auto">
            {onSolicitarCancelar && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onSolicitarCancelar(cita)}
                disabled={!puedeCancelar}
                title={
                  puedeCancelar
                    ? 'Cancelar cita'
                    : 'Las cancelaciones deben realizarse con al menos 12 horas de anticipación'
                }
                className="gap-1.5 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:border-white/10 disabled:text-white/30 disabled:hover:bg-transparent"
              >
                <XCircle className="size-3.5" />
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
