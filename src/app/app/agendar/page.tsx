'use client';

/**
 * FLUJO DE AGENDAMIENTO EN 3 PASOS — BLACK CAT NAILS WEB (BCN-21)
 *
 * Basado en la Figura 3 de los mockups (adaptada a escritorio, max-w-[720px]):
 * - Paso 1: Selección múltiple de servicios con barra inferior reactiva (duración y monto en vivo).
 * - Paso 2: Calendario y grilla de horarios; los bloques no disponibles se muestran deshabilitados, no ocultos.
 * - Paso 3: Resumen de la reserva, notas para la estilista y casilla obligatoria de política de cancelación.
 * - Navegación hacia atrás sin perder los datos seleccionados.
 * - Confirmación con toast de Sonner y redirección a /app/citas.
 * - Manejo exhaustivo de errores: sin servicios, sin horario, error 409 (horario ocupado).
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  AlertTriangle,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

import { useCatalogo } from '@/context/CatalogoContext';
import { useAgenda } from '@/context/AgendaContext';
import { citasService } from '@/services/citasService';
import { HorarioDisponible, Servicio } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';

/**
 * Formatea minutos a una cadena legible (ej. 135 -> '2 h 15 min').
 */
function formatearDuracion(minutos: number): string {
  if (minutos <= 0) return '0 min';
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  if (horas === 0) return `${mins} min`;
  if (mins === 0) return `${horas} h`;
  return `${horas} h ${mins} min`;
}

export default function AgendarPage() {
  const router = useRouter();
  const {
    servicios,
    cargando: cargandoCatalogo,
    error: errorCatalogo,
    cargarServicios,
  } = useCatalogo();
  const { crear } = useAgenda();

  // Paso actual (1: Servicios, 2: Fecha y Hora, 3: Confirmación)
  const [paso, setPaso] = useState<1 | 2 | 3>(1);

  // Estado del formulario
  const [serviciosSeleccionadosIds, setServiciosSeleccionadosIds] = useState<string[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>(() => {
    // Por defecto inicia en hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return hoy;
  });
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [notas, setNotas] = useState<string>('');
  const [aceptaPolitica, setAceptaPolitica] = useState<boolean>(false);

  // Filtro de categorías en Paso 1
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');

  // Estado de disponibilidad en Paso 2
  const [horariosDisponibles, setHorariosDisponibles] = useState<HorarioDisponible[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState<boolean>(false);
  const [errorHorarios, setErrorHorarios] = useState<string | null>(null);

  // Estado de envío en Paso 3
  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorConflicto409, setErrorConflicto409] = useState<string | null>(null);

  // Servicios activos filtrados del catálogo
  const serviciosActivos = useMemo(() => {
    return servicios.filter((s) => s.activo);
  }, [servicios]);

  // Categorías únicas
  const categorias = useMemo(() => {
    const set = new Set(serviciosActivos.map((s) => s.categoria));
    return ['todas', ...Array.from(set)];
  }, [serviciosActivos]);

  // Servicios visibles según categoría seleccionada
  const serviciosVisibles = useMemo(() => {
    if (categoriaFiltro === 'todas') return serviciosActivos;
    return serviciosActivos.filter((s) => s.categoria === categoriaFiltro);
  }, [serviciosActivos, categoriaFiltro]);

  // Objetos de servicios seleccionados
  const serviciosSeleccionados = useMemo(() => {
    return serviciosActivos.filter((s) => serviciosSeleccionadosIds.includes(s.id));
  }, [serviciosActivos, serviciosSeleccionadosIds]);

  // Totales en vivo (duración y monto)
  const duracionServiciosMin = useMemo(() => {
    return serviciosSeleccionados.reduce((total, s) => total + s.duracionMin, 0);
  }, [serviciosSeleccionados]);

  const duracionTotalConPrepMin = useMemo(() => {
    return duracionServiciosMin > 0 ? duracionServiciosMin + 15 : 0;
  }, [duracionServiciosMin]);

  const montoTotal = useMemo(() => {
    return Number(
      serviciosSeleccionados.reduce((total, s) => total + s.precio, 0).toFixed(2)
    );
  }, [serviciosSeleccionados]);

  // Alternar selección de un servicio
  const alternarServicio = (id: string) => {
    setServiciosSeleccionadosIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((sId) => sId !== id);
      } else {
        return [...prev, id];
      }
    });
    // Si cambian los servicios, reiniciamos el horario seleccionado para evitar inconsistencias
    setHoraSeleccionada(null);
    setErrorConflicto409(null);
  };

  /**
   * Cargar disponibilidad cuando se seleccione fecha o se avance al Paso 2.
   */
  const cargarDisponibilidad = useCallback(
    async (fechaAUsar?: Date, srvIdsAUsar?: string[]) => {
      const fecha = fechaAUsar ?? fechaSeleccionada;
      const srvIds = srvIdsAUsar ?? serviciosSeleccionadosIds;

      if (!fecha || srvIds.length === 0) {
        setHorariosDisponibles([]);
        return;
      }

      try {
        setCargandoHorarios(true);
        setErrorHorarios(null);
        const fechaStr = format(fecha, 'yyyy-MM-dd');
        const data = await citasService.obtenerDisponibilidad(fechaStr, srvIds);
        setHorariosDisponibles(data.horarios);

        // Si la hora previamente seleccionada ya no está disponible, desmarcarla
        setHoraSeleccionada((prevHora) => {
          if (!prevHora) return null;
          const encontrada = data.horarios.find(
            (h) => h.hora === prevHora && h.disponible
          );
          return encontrada ? prevHora : null;
        });
      } catch (err) {
        const mensaje =
          err instanceof Error
            ? err.message
            : 'No se pudo obtener la disponibilidad para esta fecha';
        setErrorHorarios(mensaje);
        setHorariosDisponibles([]);
      } finally {
        setCargandoHorarios(false);
      }
    },
    [fechaSeleccionada, serviciosSeleccionadosIds]
  );

  // Validación de Paso 1 para avanzar
  const avanzarAPaso2 = () => {
    if (serviciosSeleccionadosIds.length === 0) {
      toast.error('Selecciona al menos un servicio para continuar');
      return;
    }
    setPaso(2);
    cargarDisponibilidad(fechaSeleccionada, serviciosSeleccionadosIds);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Validación de Paso 2 para avanzar
  const avanzarAPaso3 = () => {
    if (!fechaSeleccionada) {
      toast.error('Selecciona una fecha en el calendario');
      return;
    }
    if (!horaSeleccionada) {
      toast.error('Selecciona un horario disponible para continuar');
      return;
    }
    setErrorConflicto409(null);
    setPaso(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Enviar y confirmar cita en Paso 3
  const confirmarCita = async () => {
    if (!fechaSeleccionada || !horaSeleccionada) {
      toast.error('Falta seleccionar la fecha u horario');
      setPaso(2);
      return;
    }
    if (!aceptaPolitica) {
      toast.error('Debes aceptar la política de cancelación para continuar');
      return;
    }

    try {
      setEnviando(true);
      setErrorConflicto409(null);

      const fechaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
      const inicioIso = `${fechaStr}T${horaSeleccionada}:00-06:00`;

      await crear({
        servicioIds: serviciosSeleccionadosIds,
        inicio: inicioIso,
        notas: notas.trim() || undefined,
      });

      toast.success('¡Cita agendada con éxito! Te esperamos.');
      router.push('/app/citas');
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error ? err.message : 'Ocurrió un error al agendar la cita';

      if (mensaje.includes('ocuparse') || mensaje.includes('409')) {
        setErrorConflicto409(
          'El horario seleccionado acaba de ocuparse por otra clienta. Por favor, vuelve al Paso 2 y selecciona otro bloque disponible.'
        );
        toast.error('El horario acaba de ocuparse');
      } else {
        toast.error(mensaje);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto space-y-6 pb-28">
      {/* Encabezado principal */}
      <div className="space-y-2">
        <h1 className="text-display-32 font-serif text-white tracking-tight">
          Agendar Cita
        </h1>
        <p className="text-sm text-[var(--accent)]">
          Reserva tu momento de belleza y cuidado de uñas en 3 simples pasos
        </p>
      </div>

      {/* Indicador de pasos (Figma nodos 14:20, 14:89, 14:209) */}
      <Card className="p-3.5 rounded-[16px] border border-white/10 bg-card/60 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          {/* Paso 1 */}
          <button
            type="button"
            onClick={() => setPaso(1)}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
          >
            <span
              className={`px-3.5 py-1 rounded-[100px] text-xs font-semibold transition-all ${
                paso === 1
                  ? 'bg-[var(--primary)] text-[#1A1209] shadow-sm shadow-[var(--primary)]/30'
                  : paso > 1
                    ? 'bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/40'
                    : 'bg-white/10 text-white/60'
              }`}
            >
              {paso > 1 ? '✓ Paso 1' : 'Paso 1'}
            </span>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                paso === 1 ? 'text-white font-semibold' : 'text-white/60'
              }`}
            >
              Servicios
            </span>
          </button>

          <div className="h-[2px] flex-1 bg-white/10 rounded-full mx-1" />

          {/* Paso 2 */}
          <button
            type="button"
            onClick={() => {
              if (serviciosSeleccionadosIds.length > 0) {
                setPaso(2);
                cargarDisponibilidad(fechaSeleccionada, serviciosSeleccionadosIds);
              }
            }}
            disabled={serviciosSeleccionadosIds.length === 0}
            className={`flex items-center gap-2 transition-opacity focus:outline-none ${
              serviciosSeleccionadosIds.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <span
              className={`px-3.5 py-1 rounded-[100px] text-xs font-semibold transition-all ${
                paso === 2
                  ? 'bg-[var(--primary)] text-[#1A1209] shadow-sm shadow-[var(--primary)]/30'
                  : paso > 2
                    ? 'bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/40'
                    : 'bg-white/10 text-white/60'
              }`}
            >
              {paso > 2 ? '✓ Paso 2' : 'Paso 2'}
            </span>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                paso === 2 ? 'text-white font-semibold' : 'text-white/60'
              }`}
            >
              Fecha y Hora
            </span>
          </button>

          <div className="h-[2px] flex-1 bg-white/10 rounded-full mx-1" />

          {/* Paso 3 */}
          <button
            type="button"
            onClick={() => {
              if (serviciosSeleccionadosIds.length > 0 && horaSeleccionada) setPaso(3);
            }}
            disabled={serviciosSeleccionadosIds.length === 0 || !horaSeleccionada}
            className={`flex items-center gap-2 transition-opacity focus:outline-none ${
              serviciosSeleccionadosIds.length === 0 || !horaSeleccionada
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <span
              className={`px-3.5 py-1 rounded-[100px] text-xs font-semibold transition-all ${
                paso === 3
                  ? 'bg-[var(--primary)] text-[#1A1209] shadow-sm shadow-[var(--primary)]/30'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              Paso 3
            </span>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                paso === 3 ? 'text-white font-semibold' : 'text-white/60'
              }`}
            >
              Confirmación
            </span>
          </button>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* PASO 1: SELECCIÓN MÚLTIPLE DE SERVICIOS (Figma nodo 14:8)                */}
      {/* ========================================================================= */}
      {paso === 1 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
              <Sparkles className="size-5 text-[var(--primary)]" />
              Elegí tus servicios
            </h2>
            <p className="text-xs text-white/70">
              Podés combinar múltiples servicios (ej. manicura + retiro de uñas o diseño artístico)
            </p>
          </div>

          {/* Filtros de categorías */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap capitalize ${
                  categoriaFiltro === cat
                    ? 'bg-[var(--primary)] text-white shadow-sm shadow-[var(--primary)]/20'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Lista de servicios activos */}
          {cargandoCatalogo ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-[16px] bg-white/5 animate-pulse border border-white/5"
                />
              ))}
            </div>
          ) : errorCatalogo ? (
            <Card className="p-6 text-center rounded-[16px] border border-red-500/30 bg-red-950/20 space-y-3">
              <AlertTriangle className="size-8 mx-auto text-red-400" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Error al cargar servicios disponibles</p>
                <p className="text-xs text-white/70">{errorCatalogo}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cargarServicios()}
                className="text-xs border-red-500/40 text-red-200 hover:bg-red-500/20"
              >
                <RotateCcw className="size-3.5 mr-1.5" />
                Reintentar
              </Button>
            </Card>
          ) : serviciosVisibles.length === 0 ? (
            <Card className="p-8 text-center rounded-[16px] border border-white/10 bg-card/60">
              <p className="text-sm text-white/70">
                No hay servicios activos en esta categoría.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {serviciosVisibles.map((servicio: Servicio) => {
                const seleccionado = serviciosSeleccionadosIds.includes(servicio.id);
                return (
                  <div
                    key={servicio.id}
                    onClick={() => alternarServicio(servicio.id)}
                    className={`p-4 rounded-[16px] border transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                      seleccionado
                        ? 'bg-[var(--surface)]/20 border-[var(--primary)] shadow-md shadow-[var(--primary)]/10'
                        : 'bg-card/40 border-white/10 hover:bg-card/70 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`size-6 rounded-[6px] flex items-center justify-center mt-0.5 transition-colors border-2 ${
                          seleccionado
                            ? 'bg-[var(--primary)] border-[var(--primary)] text-[#1A1209]'
                            : 'border-[var(--accent)]/60 bg-transparent text-transparent'
                        }`}
                      >
                        <Check className="size-4 stroke-[3]" />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-white truncate">
                            {servicio.nombre}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-[11px] py-0 px-2 border-[var(--accent)]/40 text-[var(--accent)] bg-[var(--accent)]/5"
                          >
                            {servicio.categoria}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-white/70">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5 text-[var(--accent)]" />
                            {servicio.duracionMin} min
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-lg font-bold text-[var(--primary)]">
                        ${servicio.precio.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Barra inferior fija con duración y monto en vivo */}
          <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-[#1A1209]/90 backdrop-blur-md border-t border-white/10 shadow-2xl">
            <div className="max-w-[720px] mx-auto flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-white/60 uppercase tracking-wider font-semibold">
                    Duración:
                  </span>
                  <span className="text-base font-bold text-white">
                    {formatearDuracion(duracionServiciosMin)}
                  </span>
                  {duracionServiciosMin > 0 && (
                    <span className="text-xs text-[var(--accent)] font-normal hidden sm:inline">
                      (+15 min preparación)
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-white/60 uppercase tracking-wider font-semibold">
                    Total:
                  </span>
                  <span className="text-xl font-extrabold text-[var(--primary)]">
                    ${montoTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                onClick={avanzarAPaso2}
                disabled={serviciosSeleccionadosIds.length === 0}
                className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[#1A1209] font-bold rounded-[16px] px-6 h-12 gap-2 shadow-lg shadow-[var(--primary)]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Continuar
                <ChevronRight className="size-4 stroke-[2.5]" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 2: CALENDARIO Y HORARIOS DISPONIBLES (Figma nodo 14:77)              */}
      {/* ========================================================================= */}
      {paso === 2 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                <CalendarIcon className="size-5 text-[var(--primary)]" />
                Fecha y hora
              </h2>
              <p className="text-xs text-white/70">
                Seleccioná el día deseado y uno de los bloques donde cabe tu servicio (
                {formatearDuracion(duracionServiciosMin)} + 15 min preparación ={' '}
                {formatearDuracion(duracionTotalConPrepMin)} total)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaso(1)}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-[12px] gap-1.5"
            >
              <ChevronLeft className="size-4" />
              Cambiar servicios
            </Button>
          </div>

          {/* Grid responsive: Calendario a la izquierda, Horarios a la derecha */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Calendario */}
            <Card className="p-4 rounded-[16px] border border-[var(--accent)]/30 bg-[#221910]/80 backdrop-blur md:col-span-6 flex flex-col items-center justify-center shadow-lg">
              <Calendar
                mode="single"
                selected={fechaSeleccionada}
                onSelect={(nuevaFecha) => {
                  if (nuevaFecha) {
                    setFechaSeleccionada(nuevaFecha);
                    setHoraSeleccionada(null);
                    cargarDisponibilidad(nuevaFecha, serviciosSeleccionadosIds);
                  }
                }}
                disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                className="rounded-md"
              />
              {fechaSeleccionada && (
                <div className="w-full mt-2 pt-2 border-t border-white/10 text-center text-xs text-[var(--accent)] font-medium capitalize">
                  {format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
                </div>
              )}
            </Card>

            {/* Selector de Horarios */}
            <Card className="p-4 rounded-[16px] border border-[var(--accent)]/30 bg-[#221910]/80 backdrop-blur md:col-span-6 flex flex-col justify-between space-y-4 shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-serif font-bold text-white">Horarios disponibles</span>
                  <span className="text-xs text-white/60">
                    Duración: {formatearDuracion(duracionTotalConPrepMin)}
                  </span>
                </div>

                {cargandoHorarios ? (
                  <div className="grid grid-cols-3 gap-2 py-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="h-10 rounded-[12px] bg-white/5 animate-pulse border border-white/5"
                      />
                    ))}
                  </div>
                ) : errorHorarios ? (
                  <div className="p-4 rounded-[12px] bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex flex-col gap-2.5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                      <span>{errorHorarios}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() =>
                        cargarDisponibilidad(fechaSeleccionada, serviciosSeleccionadosIds)
                      }
                      className="self-start text-xs border-red-400/30 text-red-300 hover:bg-red-500/20"
                    >
                      <RotateCcw className="size-3 mr-1" />
                      Reintentar
                    </Button>
                  </div>
                ) : horariosDisponibles.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/60 space-y-1">
                    <p>No hay bloques configurados o la fecha es anterior a hoy.</p>
                    <p className="text-[var(--accent)]">Selecciona otra fecha en el calendario.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[280px] overflow-y-auto pr-1">
                    {horariosDisponibles.map((h) => {
                      const seleccionado = horaSeleccionada === h.hora;
                      return (
                        <button
                          key={h.hora}
                          type="button"
                          disabled={!h.disponible}
                          onClick={() => setHoraSeleccionada(h.hora)}
                          title={
                            h.disponible
                              ? `Disponible a las ${h.hora}`
                              : `No disponible (no cabe antes del cierre o ya está ocupado)`
                          }
                          className={`py-2 px-2.5 rounded-[10px] text-xs font-semibold transition-all flex items-center justify-center gap-1 border ${
                            h.disponible
                              ? seleccionado
                                ? 'bg-[var(--primary)] text-[#1A1209] font-bold border-transparent shadow-md shadow-[var(--primary)]/30 ring-2 ring-[var(--primary)]/40'
                                : 'bg-[#221910] border border-[var(--accent)]/40 text-white hover:border-[var(--primary)] hover:bg-[#2c1e14] cursor-pointer'
                              : 'bg-white/[0.02] border-white/5 text-white/25 cursor-not-allowed line-through'
                          }`}
                        >
                          <Clock className="size-3 shrink-0" />
                          {h.hora}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Leyenda explicativa */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-[var(--primary)]" />
                  <span>Seleccionado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-[#221910] border border-[var(--accent)]/40" />
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-white/10 line-through text-white/30" />
                  <span>No cabe / Ocupado</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Botones de navegación del Paso 2 */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaso(1)}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-[16px] px-5 h-11 gap-2 cursor-pointer"
            >
              <ChevronLeft className="size-4" />
              Atrás
            </Button>

            <Button
              type="button"
              onClick={avanzarAPaso3}
              disabled={!fechaSeleccionada || !horaSeleccionada}
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[#1A1209] font-bold rounded-[16px] px-6 h-11 gap-2 shadow-lg shadow-[var(--primary)]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              Continuar
              <ChevronRight className="size-4 stroke-[2.5]" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 3: RESUMEN, NOTAS Y CONFIRMACIÓN (Figma nodo 14:197)                 */}
      {/* ========================================================================= */}
      {paso === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="size-5 text-[var(--primary)]" />
              Confirmación
            </h2>
            <p className="text-xs text-white/70">
              Revisá los detalles de tu cita antes de confirmar
            </p>
          </div>

          {/* Alerta de conflicto 409 si ocurrió */}
          {errorConflicto409 && (
            <div className="p-4 rounded-[16px] bg-red-500/15 border border-red-500/30 text-red-200 text-sm flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-5 text-red-400 shrink-0 mt-0.5" />
                <span>{errorConflicto409}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPaso(2);
                  cargarDisponibilidad(fechaSeleccionada, serviciosSeleccionadosIds);
                }}
                className="self-start border-red-400/40 text-red-200 hover:bg-red-500/20 rounded-[12px] mt-1"
              >
                Volver a seleccionar horario
              </Button>
            </div>
          )}

          {/* Tarjeta de Resumen Berry Crush (Figma nodo 14:217) */}
          <Card className="p-5 rounded-[16px] border border-white/15 bg-[var(--surface)] text-white shadow-2xl space-y-4">
            <p className="font-serif font-bold text-[18px] text-white">
              Resumen de tu cita
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Fila Servicios */}
              <div className="flex items-center gap-3">
                <div className="size-1.5 rounded-[2px] bg-white shrink-0" />
                <span className="text-sm text-white/70">Servicios:</span>
                <span className="text-sm font-semibold text-white ml-auto text-right">
                  {serviciosSeleccionados.map((s) => s.nombre).join(', ')}
                </span>
              </div>

              {/* Fila Fecha */}
              <div className="flex items-center gap-3">
                <div className="size-1.5 rounded-[2px] bg-white shrink-0" />
                <span className="text-sm text-white/70">Fecha:</span>
                <span className="text-sm font-semibold text-white ml-auto text-right capitalize">
                  {fechaSeleccionada
                    ? format(fechaSeleccionada, "EEE d MMM yyyy", { locale: es })
                    : 'No seleccionada'}
                </span>
              </div>

              {/* Fila Hora */}
              <div className="flex items-center gap-3">
                <div className="size-1.5 rounded-[2px] bg-white shrink-0" />
                <span className="text-sm text-white/70">Hora:</span>
                <span className="text-sm font-semibold text-white ml-auto text-right">
                  {horaSeleccionada} ({formatearDuracion(duracionTotalConPrepMin)})
                </span>
              </div>

              {/* Fila Total */}
              <div className="flex items-center gap-3 pt-1 border-t border-white/20">
                <div className="size-1.5 rounded-[2px] bg-white shrink-0" />
                <span className="text-sm text-white/70">Total:</span>
                <span className="text-lg font-bold text-white ml-auto text-right">
                  ${montoTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Desglose complementario de servicios y preparación */}
            <div className="pt-2 border-t border-white/15 space-y-1.5 text-xs text-white/80">
              <div className="flex justify-between">
                <span>Duración de servicios:</span>
                <span className="font-medium">{formatearDuracion(duracionServiciosMin)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tiempo de preparación:</span>
                <span className="font-medium">15 min</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Tiempo total estimado:</span>
                <span>{formatearDuracion(duracionTotalConPrepMin)}</span>
              </div>
            </div>
          </Card>

          {/* Notas para la estilista (Figma nodo 14:233) */}
          <Card className="p-4 rounded-[16px] border border-white/10 bg-[#221910]/80 backdrop-blur space-y-2">
            <label htmlFor="notas" className="text-sm font-semibold text-white flex items-center justify-between">
              <span>Notas para la estilista</span>
              <span className="text-xs text-white/50 font-normal">{notas.length}/300</span>
            </label>
            <textarea
              id="notas"
              rows={3}
              maxLength={300}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="¿Algún detalle o preferencia especial?"
              className="w-full bg-[#1A1209] border border-[var(--accent)]/50 focus:border-[var(--primary)] rounded-[12px] p-3 text-sm text-white placeholder:text-white/50 focus:outline-none transition-colors resize-none"
            />
          </Card>

          {/* Casilla de política de cancelación (Figma nodo 14:243) */}
          <div
            onClick={() => setAceptaPolitica((prev) => !prev)}
            className={`p-3.5 rounded-[12px] border transition-all cursor-pointer flex items-start gap-3 select-none ${
              aceptaPolitica
                ? 'bg-[#221910] border-[var(--primary)]'
                : 'bg-[#221910]/60 border-white/10 hover:border-white/20'
            }`}
          >
            <div
              className={`mt-0.5 size-5 rounded-[4px] flex items-center justify-center shrink-0 border transition-colors ${
                aceptaPolitica
                  ? 'bg-[var(--primary)] border-[var(--primary)] text-[#1A1209]'
                  : 'border-[var(--accent)]/60 bg-transparent text-transparent'
              }`}
            >
              <Check className="size-3.5 stroke-[3]" />
            </div>
            <div className="space-y-1 text-xs">
              <p className="text-white/80 leading-normal">
                Acepto la{' '}
                <span className="text-[#9aa6e0] underline decoration-solid font-medium">
                  política de cancelación
                </span>{' '}
                de turnos
              </p>
              <p className="text-white/60 text-[11px] leading-relaxed">
                Las citas deben cancelarse con al menos 12 horas de anticipación.
              </p>
            </div>
          </div>

          {/* Botones de acción del Paso 3 (Figma nodo 14:247) */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPaso(2);
                cargarDisponibilidad(fechaSeleccionada, serviciosSeleccionadosIds);
              }}
              disabled={enviando}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-[16px] px-5 h-12 gap-2 cursor-pointer"
            >
              <ChevronLeft className="size-4" />
              Atrás
            </Button>

            <Button
              type="button"
              onClick={confirmarCita}
              disabled={!aceptaPolitica || enviando}
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[#1A1209] font-bold rounded-[12px] px-8 h-12 gap-2 shadow-xl shadow-[var(--primary)]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-base"
            >
              {enviando ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Agendando cita...
                </>
              ) : (
                'Confirmar cita'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
