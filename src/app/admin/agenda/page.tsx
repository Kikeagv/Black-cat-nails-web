'use client';

/**
 * AGENDA SEMANAL DE ADMINISTRADORA — BLACK CAT NAILS WEB (BCN-25)
 *
 * Basado en la Figura 5 de Figma (nodo 32:4 / agenda-semanal):
 * - Vista semanal con 7 columnas (Lunes a Domingo) y navegación temporal.
 * - Altura de cada bloque proporcional a la duración real de la cita (1 min = 1 px).
 * - Franjas fuera del horario comercial marcadas como no disponibles (RN-01 / HORARIO).
 * - Panel lateral con el detalle de la cita: clienta, servicios, desglose de montos y notas.
 * - Acciones de completar servicio, marcar inasistencia y cancelar (RN-02 / RN-03).
 * - Botón de nueva cita manual que reutiliza el flujo de agendamiento y disponibilidad.
 */

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAgenda } from '@/context/AgendaContext';
import { Cita, EstadoCita } from '@/types';
import {
  obtenerLunesSemana,
  obtenerDomingoSemana,
  obtenerDiasSemanaInfo,
  formatearRangoSemana,
  formatearFechaYMD,
} from '@/domain/agendaSemanal';
import {
  SemanaHeader,
  AgendaGrid,
  CitaDetallePanel,
  NuevaCitaManualModal,
} from '@/components/admin/agenda';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminAgendaPage() {
  const { citas, cargando, error, cambiarEstado, recargar } = useAgenda();

  // Fecha de referencia inicial: fijada a la semana de Figma (24-30 ago 2026) para visualización inmediata del seed
  const [fechaReferencia, setFechaReferencia] = useState<Date>(() => {
    // 25 de agosto de 2026 (mes 7 en índice 0 de JS)
    return new Date(2026, 7, 25);
  });

  const [citaSeleccionadaId, setCitaSeleccionadaId] = useState<string | null>(null);
  const [modalManualAbierto, setModalManualAbierto] = useState(false);
  const [vistaModo, setVistaModo] = useState<'dia' | 'semana' | 'mes'>('semana');

  // Cálculo de semana: lunes inicial y domingo final
  const lunes = useMemo(() => obtenerLunesSemana(fechaReferencia), [fechaReferencia]);
  const domingo = useMemo(() => obtenerDomingoSemana(lunes), [lunes]);
  const diasSemana = useMemo(() => obtenerDiasSemanaInfo(lunes), [lunes]);
  const rangoTexto = useMemo(() => formatearRangoSemana(lunes, domingo), [lunes, domingo]);

  // Citas pertenecientes a la semana visible
  const lunesStr = useMemo(() => formatearFechaYMD(lunes), [lunes]);
  const domingoStr = useMemo(() => formatearFechaYMD(domingo), [domingo]);

  const citasSemana = useMemo(() => {
    return citas.filter((c) => {
      const fechaCita = c.inicio.slice(0, 10);
      return fechaCita >= lunesStr && fechaCita <= domingoStr;
    });
  }, [citas, lunesStr, domingoStr]);

  // Obtener entidad completa de la cita seleccionada (o la primera de la semana por defecto)
  const citaSeleccionada = useMemo(() => {
    if (citaSeleccionadaId) {
      const encontrada = citasSemana.find((c) => c.id === citaSeleccionadaId);
      if (encontrada) return encontrada;
    }
    return citasSemana.length > 0 ? citasSemana[0] : null;
  }, [citasSemana, citaSeleccionadaId]);

  // Navegación semanal
  const handleSemanaAnterior = () => {
    setFechaReferencia((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleSemanaSiguiente = () => {
    setFechaReferencia((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleHoy = () => {
    setFechaReferencia(new Date());
  };

  // Manejador reactivo de transición de estados
  const handleCambiarEstado = async (id: string, nuevoEstado: EstadoCita) => {
    try {
      await cambiarEstado(id, nuevoEstado);
      toast.success(`Cita actualizada a "${nuevoEstado}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado de cita';
      toast.error(msg);
    }
  };

  // Callback al agendar cita manual
  const handleCitaCreada = (nuevaCita: Cita) => {
    // Si la nueva cita cae en otra fecha, navegar hacia su semana
    const fechaCita = new Date(nuevaCita.inicio);
    if (!isNaN(fechaCita.getTime())) {
      setFechaReferencia(fechaCita);
    }
    setCitaSeleccionadaId(nuevaCita.id);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8">
      {/* 1. Cabecera con título, navegación de semanas y botón de nueva cita */}
      <SemanaHeader
        rangoTexto={rangoTexto}
        onSemanaAnterior={handleSemanaAnterior}
        onSemanaSiguiente={handleSemanaSiguiente}
        onHoy={handleHoy}
        vistaModo={vistaModo}
        onCambiarVista={setVistaModo}
        onNuevaCita={() => setModalManualAbierto(true)}
      />

      {/* 2. Alerta de error si falla la carga */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-300 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => recargar()}
            className="text-white hover:bg-white/10 gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            <span>Reintentar</span>
          </Button>
        </div>
      )}

      {/* 3. Área de trabajo: Grilla semanal (izquierda) + Panel lateral de detalle (derecha) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Grilla Semanal */}
        <div className="flex-1 min-w-0 w-full">
          {cargando && citas.length === 0 ? (
            <div className="bg-white/4 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[500px]">
              <Loader2 className="size-8 animate-spin text-[#E070C4] mb-3" />
              <p className="text-white/60 text-sm">Cargando agenda semanal...</p>
            </div>
          ) : (
            <AgendaGrid
              diasSemana={diasSemana}
              citas={citasSemana}
              citaSeleccionadaId={citaSeleccionadaId}
              onSelectCita={(cita) => setCitaSeleccionadaId(cita.id)}
              diaActivoFechaStr={citaSeleccionada?.inicio.slice(0, 10)}
            />
          )}
        </div>

        {/* Panel lateral con el detalle de la cita */}
        <CitaDetallePanel
          cita={citaSeleccionada}
          onCambiarEstado={handleCambiarEstado}
          cargandoAccion={cargando}
        />
      </div>

      {/* 4. Modal para agendar nueva cita manual */}
      {modalManualAbierto && (
        <NuevaCitaManualModal
          abierto={modalManualAbierto}
          onCerrar={() => setModalManualAbierto(false)}
          onCitaCreada={handleCitaCreada}
          fechaInicial={formatearFechaYMD(fechaReferencia)}
        />
      )}
    </div>
  );
}
