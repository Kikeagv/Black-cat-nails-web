'use client';

/**
 * PANTALLA MIS CITAS — CLIENTA (BCN-24)
 *
 * Vista de autogestión de citas para clientas según la Figura 4 de Figma:
 * - Pestañas segmentadas: Próximas e Historial con contadores.
 * - Tarjetas con bloque de fecha, desglose de servicios e insignia de estado temática.
 * - Acciones: Confirmar cita y Cancelar con validación de 12 horas.
 * - Modal de confirmación antes de cancelar.
 * - Banner de retoque y fidelización cuando corresponde.
 * - Actualización de estado en tiempo real sin recargar mediante AgendaContext.
 */

import React, { useMemo, useState } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { Cita } from '@/types';
import { toast } from 'sonner';
import {
  CitaCard,
  CancelarCitaModal,
  AvisoRetoqueBanner,
  CitasEmptyState,
} from '@/components/citas';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function MisCitasPage() {
  const { citas, cargando, error, cambiarEstado, recargar } = useAgenda();
  const [pestanaActiva, setPestanaActiva] = useState<'proximas' | 'historial'>('proximas');

  // Estado del modal de cancelación
  const [citaACancelar, setCitaACancelar] = useState<Cita | null>(null);
  const [cancelando, setCancelando] = useState<boolean>(false);

  // 1. Filtrar citas próximas e historial
  const citasProximas = useMemo(() => {
    return citas
      .filter((c) => ['solicitada', 'confirmada', 'en_curso'].includes(c.estado))
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
  }, [citas]);

  const citasHistorial = useMemo(() => {
    return citas
      .filter((c) => ['completada', 'cancelada', 'inasistencia'].includes(c.estado))
      .sort((a, b) => b.inicio.localeCompare(a.inicio));
  }, [citas]);

  // 2. Determinar si corresponde mostrar el aviso de retoque (loyalty banner)
  const citaConAvisoRetoque = useMemo(() => {
    // Si tiene citas próximas en agenda, ya tiene cita agendada
    if (citasProximas.length > 0) return null;

    const completadas = citasHistorial.filter((c) => c.estado === 'completada');
    if (completadas.length === 0) return null;

    // Tomar la cita completada más reciente
    return completadas[0];
  }, [citasProximas, citasHistorial]);

  // 3. Confirmar cita (reactivo, sin recargar)
  const handleConfirmarCita = async (id: string) => {
    try {
      await cambiarEstado(id, 'confirmada');
      toast.success('¡Cita confirmada! Te esperamos en nuestro local.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al confirmar la cita');
    }
  };

  // 4. Cancelar cita mediante modal
  const handleConfirmarCancelacion = async (id: string) => {
    try {
      setCancelando(true);
      await cambiarEstado(id, 'cancelada');
      toast.success('Tu cita ha sido cancelada exitosamente.');
      setCitaACancelar(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cancelar la cita');
    } finally {
      setCancelando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="space-y-1">
        <h1 className="text-display-32 font-serif text-white">Mis Citas</h1>
        <p className="text-sm text-[var(--accent)] font-medium">
          Próximas citas e historial de reservas
        </p>
      </div>

      {/* Pestañas segmentadas (Figma segment-tabs) */}
      <div className="p-1 rounded-full sm:rounded-[18px] bg-white/5 border border-white/10 max-w-sm sm:max-w-md mx-auto grid grid-cols-2 gap-1 select-none">
        <button
          type="button"
          onClick={() => setPestanaActiva('proximas')}
          className={`py-2 px-3 rounded-full sm:rounded-[14px] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
            pestanaActiva === 'proximas'
              ? 'bg-[var(--primary)] text-white shadow-md'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>Próximas</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              pestanaActiva === 'proximas'
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-white/70'
            }`}
          >
            {citasProximas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPestanaActiva('historial')}
          className={`py-2 px-3 rounded-full sm:rounded-[14px] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
            pestanaActiva === 'historial'
              ? 'bg-[var(--primary)] text-white shadow-md'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>Historial</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              pestanaActiva === 'historial'
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-white/70'
            }`}
          >
            {citasHistorial.length}
          </span>
        </button>
      </div>

      {/* Estado de error */}
      {error && (
        <div className="rounded-[16px] p-4 bg-red-500/10 border border-red-500/30 text-red-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="size-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => recargar()}
            className="border-red-500/30 text-red-200 hover:bg-red-500/20"
          >
            <RotateCcw className="size-3 mr-1" />
            Reintentar
          </Button>
        </div>
      )}

      {/* Estado de carga con esqueletos */}
      {cargando && citas.length === 0 ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 rounded-[18px] bg-white/5 border border-white/10"
            />
          ))}
        </div>
      ) : (
        /* Lista de citas según pestaña activa */
        <div className="space-y-4">
          {pestanaActiva === 'proximas' ? (
            citasProximas.length > 0 ? (
              <div className="space-y-3">
                {citasProximas.map((cita) => (
                  <CitaCard
                    key={cita.id}
                    cita={cita}
                    onConfirmar={handleConfirmarCita}
                    onSolicitarCancelar={(c) => setCitaACancelar(c)}
                  />
                ))}
              </div>
            ) : (
              <CitasEmptyState pestana="proximas" />
            )
          ) : (
            /* Pestaña Historial */
            <div className="space-y-4">
              {/* Aviso de retoque si corresponde (loyalty-banner en Figma) */}
              {citaConAvisoRetoque && (
                <AvisoRetoqueBanner fechaRetoque={citaConAvisoRetoque.fechaRetoque} />
              )}

              {citasHistorial.length > 0 ? (
                <div className="space-y-3">
                  {citasHistorial.map((cita) => (
                    <CitaCard key={cita.id} cita={cita} />
                  ))}
                </div>
              ) : (
                <CitasEmptyState pestana="historial" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación de cancelación */}
      <CancelarCitaModal
        cita={citaACancelar}
        abierto={Boolean(citaACancelar)}
        onCerrar={() => !cancelando && setCitaACancelar(null)}
        onConfirmar={handleConfirmarCancelacion}
        cargando={cancelando}
      />
    </div>
  );
}
