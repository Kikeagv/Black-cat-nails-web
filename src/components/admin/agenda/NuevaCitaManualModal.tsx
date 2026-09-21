'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';
import { useCatalogo } from '@/context/CatalogoContext';
import { useAgenda } from '@/context/AgendaContext';
import { clientasService } from '@/services/clientasService';
import { citasService } from '@/services/citasService';
import { Cita, HorarioDisponible, Usuaria } from '@/types';
import {
  Calendar,
  Check,
  Clock,
  Loader2,
  Sparkles,
  User,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export interface NuevaCitaManualModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onCitaCreada?: (nuevaCita: Cita) => void;
  fechaInicial?: string; // YYYY-MM-DD
}

type ResultadoDisponibilidad =
  | { clave: string; tipo: 'exito'; horarios: HorarioDisponible[] }
  | { clave: string; tipo: 'error'; mensaje: string };

export function NuevaCitaManualModal({
  abierto,
  onCerrar,
  onCitaCreada,
  fechaInicial,
}: NuevaCitaManualModalProps) {
  const { servicios } = useCatalogo();
  const { crear } = useAgenda();

  // Estados de carga de datos iniciales
  const [clientas, setClientas] = useState<Usuaria[]>([]);
  const [cargandoClientas, setCargandoClientas] = useState(false);

  // Estados del formulario
  const [clientaId, setClientaId] = useState<string>('');
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<string[]>([]);
  const [fecha, setFecha] = useState<string>(() => {
    if (fechaInicial) return fechaInicial;
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  });
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>('');
  const [notas, setNotas] = useState<string>('');

  // Disponibilidad de horarios
  const [resultadoDisponibilidad, setResultadoDisponibilidad] =
    useState<ResultadoDisponibilidad | null>(null);

  const claveDisponibilidad =
    fecha && serviciosSeleccionados.length > 0
      ? `${fecha}|${serviciosSeleccionados.join(',')}`
      : null;
  const disponibilidadActual =
    resultadoDisponibilidad?.clave === claveDisponibilidad
      ? resultadoDisponibilidad
      : null;
  const horarios =
    disponibilidadActual?.tipo === 'exito' ? disponibilidadActual.horarios : [];
  const errorHorarios =
    disponibilidadActual?.tipo === 'error' ? disponibilidadActual.mensaje : null;
  const cargandoHorarios = Boolean(claveDisponibilidad) && !disponibilidadActual;

  // Estado de envío
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  // Cargar lista de clientas al abrir el modal
  useEffect(() => {
    if (!abierto) return;

    let isMounted = true;

    clientasService
      .listar()
      .then((data) => {
        if (isMounted) {
          setClientas(data);
          setClientaId((prev) => prev || (data[0]?.id ?? ''));
        }
      })
      .catch(() => {
        if (isMounted) {
          toast.error('No se pudo cargar la lista de clientas');
        }
      })
      .finally(() => {
        if (isMounted) setCargandoClientas(false);
      });

    return () => {
      isMounted = false;
    };
  }, [abierto]);

  // Consultar disponibilidad de horarios cuando cambian los servicios o la fecha
  useEffect(() => {
    if (!claveDisponibilidad) return;

    let isMounted = true;

    citasService
      .obtenerDisponibilidad(fecha, serviciosSeleccionados)
      .then((res) => {
        if (isMounted) {
          setResultadoDisponibilidad({
            clave: claveDisponibilidad,
            tipo: 'exito',
            horarios: res.horarios || [],
          });
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setResultadoDisponibilidad({
            clave: claveDisponibilidad,
            tipo: 'error',
            mensaje:
              err instanceof Error ? err.message : 'Error al consultar disponibilidad',
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [claveDisponibilidad, fecha, serviciosSeleccionados]);

  // Calcular duración y montos de los servicios seleccionados
  const serviciosActivos = servicios.filter((s) => s.activo);
  const serviciosElegidos = serviciosActivos.filter((s) =>
    serviciosSeleccionados.includes(s.id)
  );
  const duracionTotalMin =
    serviciosElegidos.reduce((sum, s) => sum + s.duracionMin, 0) +
    (serviciosElegidos.length > 0 ? 15 : 0); // +15 min preparación
  const montoTotal = serviciosElegidos.reduce((sum, s) => sum + s.precio, 0);

  const toggleServicio = (id: string) => {
    setServiciosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setHoraSeleccionada('');
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientaId || serviciosSeleccionados.length === 0 || !fecha || !horaSeleccionada) {
      return;
    }

    try {
      setEnviando(true);
      setErrorEnvio(null);

      // Construir inicio en formato ISO El Salvador (-06:00)
      const inicioIso = `${fecha}T${horaSeleccionada}:00-06:00`;

      const nuevaCita = await crear({
        clientaId,
        servicioIds: serviciosSeleccionados,
        inicio: inicioIso,
        notas: notas.trim() || undefined,
      });

      toast.success('Cita manual agendada exitosamente');
      onCitaCreada?.(nuevaCita);
      onCerrar();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al agendar la cita';
      setErrorEnvio(msg);
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(open) => !enviando && !open && onCerrar()}>
      <DialogContent className="sm:max-w-xl bg-[#1A1209] border border-white/15 text-white p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleCrear} className="flex flex-col gap-5">
          <DialogHeader className="gap-1.5 text-left">
            <div className="flex items-center gap-2 text-[#E070C4]">
              <Sparkles className="size-5" />
              <DialogTitle className="text-xl font-serif font-bold text-white">
                Nueva Cita Manual
              </DialogTitle>
            </div>
            <DialogDescription className="text-white/60 text-xs">
              Registra una cita directa para una clienta verificando disponibilidad en tiempo real.
            </DialogDescription>
          </DialogHeader>

          {errorEnvio && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-300 text-xs">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorEnvio}</span>
            </div>
          )}

          {/* 1. Seleccionar Clienta */}
          <Field className="gap-2">
            <FieldLabel
              htmlFor="clienta-select"
              className="gap-1.5 text-xs font-semibold text-white/80"
            >
              <User className="size-3.5 text-[var(--accent)]" />
              <span>Clienta destinataria</span>
            </FieldLabel>
            {cargandoClientas ? (
              <div className="flex items-center gap-2 text-xs text-white/50 p-2.5 bg-white/5 rounded-xl border border-white/10">
                <Loader2 className="size-4 animate-spin text-[#E070C4]" />
                <span>Cargando clientas registradas...</span>
              </div>
            ) : (
              <NativeSelect
                id="clienta-select"
                value={clientaId}
                onChange={(e) => setClientaId(e.target.value)}
                required
                className="w-full"
              >
                <NativeSelectOption value="" disabled className="text-white/40">
                  Selecciona una clienta...
                </NativeSelectOption>
                {clientas.map((c) => (
                  <NativeSelectOption key={c.id} value={c.id}>
                    {c.nombre} ({c.correo}) {c.inasistencias > 0 ? `· ${c.inasistencias} inasist.` : ''}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </Field>

          {/* 2. Seleccionar Servicios */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-[#E070C4]" />
                <span>Servicios a solicitar</span>
              </span>
              {serviciosElegidos.length > 0 && (
                <span className="text-xs text-[var(--accent)] font-medium">
                  {duracionTotalMin} min · ${montoTotal.toFixed(2)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {serviciosActivos.map((srv) => {
                const seleccionado = serviciosSeleccionados.includes(srv.id);
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => toggleServicio(srv.id)}
                    className={`flex items-start justify-between p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      seleccionado
                        ? 'bg-[#E070C4]/15 border-[#E070C4] text-white shadow-xs'
                        : 'bg-white/4 border-white/10 text-white/70 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-1">
                      <span className="font-semibold text-white truncate">{srv.nombre}</span>
                      <span className="text-[11px] text-white/50">{srv.duracionMin} min</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-bold text-[#E070C4]">${srv.precio}</span>
                      {seleccionado && <Check className="size-3.5 text-[#E070C4]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Fecha y Horarios Disponibles */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <label htmlFor="fecha-cita" className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-[var(--accent)]" />
                  <span>Fecha</span>
                </label>
                <input
                  id="fecha-cita"
                  type="date"
                  value={fecha}
                  onChange={(e) => {
                    setFecha(e.target.value);
                    setHoraSeleccionada('');
                  }}
                  required
                  className="w-full bg-white/5 border border-white/15 rounded-xl p-2 text-sm text-white focus:outline-none focus:border-[#E070C4] transition-colors"
                />
              </div>
            </div>

            {/* Selector de bloques horarios */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                <Clock className="size-3.5 text-[var(--accent)]" />
                <span>Horarios calculados</span>
              </span>

              {cargandoHorarios ? (
                <div className="flex items-center gap-2 text-xs text-white/50 py-4 justify-center bg-white/4 rounded-xl border border-white/10">
                  <Loader2 className="size-4 animate-spin text-[#E070C4]" />
                  <span>Consultando disponibilidad...</span>
                </div>
              ) : errorHorarios ? (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs">
                  {errorHorarios}
                </div>
              ) : horarios.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {horarios.map((h) => {
                    const seleccionado = horaSeleccionada === h.hora;
                    return (
                      <button
                        key={h.hora}
                        type="button"
                        disabled={!h.disponible}
                        onClick={() => setHoraSeleccionada(h.hora)}
                        className={`py-2 px-1 text-center rounded-lg text-xs font-medium border transition-all ${
                          !h.disponible
                            ? 'bg-zinc-900/60 border-zinc-800 text-zinc-600 line-through cursor-not-allowed'
                            : seleccionado
                            ? 'bg-[#E070C4] border-[#E070C4] text-[#1A1209] font-bold shadow-sm'
                            : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer'
                        }`}
                      >
                        {h.hora}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-white/4 rounded-xl border border-white/10 text-center text-xs text-white/40">
                  Selecciona al menos un servicio y fecha para calcular los bloques horarios.
                </div>
              )}
            </div>
          </div>

          {/* 4. Notas */}
          <Field className="gap-1.5">
            <FieldLabel
              htmlFor="notas-cita"
              className="text-xs font-semibold text-white/80"
            >
              Notas o especificaciones
            </FieldLabel>
            <Textarea
              id="notas-cita"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Preferencias de color, diseño o detalles relevantes..."
              rows={2}
              className="text-xs"
            />
          </Field>

          <DialogFooter className="mt-2 flex-col-reverse sm:flex-row gap-2 border-t-0 bg-transparent p-0">
            <Button
              type="button"
              variant="outline"
              onClick={onCerrar}
              disabled={enviando}
              className="w-full sm:w-auto border-white/15 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                enviando ||
                !clientaId ||
                serviciosSeleccionados.length === 0 ||
                !fecha ||
                !horaSeleccionada
              }
              className="w-full sm:w-auto bg-[#E070C4] hover:bg-[#E070C4]/90 text-[#1A1209] font-bold text-sm gap-2 rounded-xl cursor-pointer"
            >
              {enviando && <Loader2 className="size-4 animate-spin" />}
              <span>Agendar cita manual</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
