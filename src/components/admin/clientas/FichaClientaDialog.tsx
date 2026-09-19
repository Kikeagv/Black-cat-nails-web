'use client';

import React, { useEffect, useState } from 'react';
import {
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  DollarSign,
  Sparkles,
  Lock,
  Save,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FichaClientaDetalle } from '@/domain/clientas';
import { clientasService } from '@/services/clientasService';
import { EstadoCita } from '@/types';

interface FichaClientaDialogProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  clientaId: string | null;
  onClientaActualizada?: () => void;
}

export function FichaClientaDialog({
  abierto,
  onOpenChange,
  clientaId,
  onClientaActualizada,
}: FichaClientaDialogProps) {
  const [ficha, setFicha] = useState<FichaClientaDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estado para la edición de notas privadas
  const [notasPrivadas, setNotasPrivadas] = useState('');
  const [guardandoNotas, setGuardandoNotas] = useState(false);

  // Estado de carga derivado declarativamente para evitar cascading renders
  const cargando = Boolean(abierto && clientaId && !ficha && !error);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFicha(null);
      setError(null);
    }
    onOpenChange(open);
  };

  useEffect(() => {
    if (!abierto || !clientaId) return;

    let activo = true;

    clientasService
      .obtenerFicha(clientaId)
      .then((res) => {
        if (activo) {
          setFicha(res);
          setNotasPrivadas(res.clienta.notasPrivadas || '');
          setError(null);
        }
      })
      .catch((err) => {
        if (activo) {
          setError(
            err instanceof Error
              ? err.message
              : 'Error al cargar la ficha de la clienta.'
          );
        }
      });

    return () => {
      activo = false;
    };
  }, [abierto, clientaId]);

  const handleGuardarNotas = async () => {
    if (!clientaId) return;

    try {
      setGuardandoNotas(true);
      const res = await clientasService.actualizar(clientaId, {
        notasPrivadas,
      });
      setFicha(res);
      toast.success('Notas privadas guardadas correctamente.');
      if (onClientaActualizada) {
        onClientaActualizada();
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'No se pudieron guardar las notas privadas.'
      );
    } finally {
      setGuardandoNotas(false);
    }
  };

  const getBadgeEstadoCita = (estado: EstadoCita) => {
    switch (estado) {
      case 'completada':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
            Completada
          </Badge>
        );
      case 'confirmada':
        return (
          <Badge className="bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30 text-xs">
            Confirmada
          </Badge>
        );
      case 'en_curso':
        return (
          <Badge className="bg-[var(--surface)]/40 text-pink-200 border border-[var(--surface)] text-xs">
            En curso
          </Badge>
        );
      case 'solicitada':
        return (
          <Badge className="bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 text-xs">
            Solicitada
          </Badge>
        );
      case 'inasistencia':
        return (
          <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs">
            Inasistencia
          </Badge>
        );
      case 'cancelada':
      default:
        return (
          <Badge className="bg-white/10 text-white/60 border border-white/10 text-xs">
            Cancelada
          </Badge>
        );
    }
  };

  const formatearFecha = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('es-SV', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-white/10 bg-[#1A1209] text-white p-6 rounded-[16px] space-y-5">
        {cargando && (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="size-8 text-[var(--primary)] animate-spin" />
            <p className="text-sm text-white/60">Cargando ficha de clienta...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300">
            {error}
          </div>
        )}

        {!cargando && ficha && (
          <>
            {/* 1. Cabecera con datos personales y avatar */}
            <DialogHeader className="space-y-2 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-[var(--surface)] text-white flex items-center justify-center font-bold text-lg border border-white/10 shrink-0">
                    {ficha.clienta.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <DialogTitle className="font-serif text-2xl font-bold text-white flex items-center gap-2">
                      <span>{ficha.clienta.nombre}</span>
                      {ficha.metricas.esActiva ? (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px]">
                          Activa
                        </Badge>
                      ) : (
                        <Badge className="bg-white/10 text-white/50 border border-white/10 text-[11px]">
                          Inactiva
                        </Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-white/50 flex items-center gap-4 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="size-3 text-white/40" />
                        {ficha.clienta.correo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="size-3 text-white/40" />
                        {ficha.clienta.telefono}
                      </span>
                    </DialogDescription>
                  </div>
                </div>
              </div>

              {/* Marca visible si acumula 2 o más inasistencias */}
              {ficha.metricas.alertaInasistencias && (
                <div className="mt-2 p-3 rounded-[12px] bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2.5 font-medium">
                  <AlertTriangle className="size-4 shrink-0 text-red-400" />
                  <span>
                    Atención: Esta clienta acumula{' '}
                    <strong>{ficha.metricas.inasistencias} inasistencias</strong>.
                    Se recomienda solicitar confirmación obligatoria previa a su
                    cita.
                  </span>
                </div>
              )}
            </DialogHeader>

            {/* 2. Tarjetas de métricas consolidadas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-3.5 rounded-[12px] bg-white/5 border border-white/8 space-y-1">
                <span className="text-[11px] text-white/50">Total Gastado</span>
                <div className="text-xl font-bold text-emerald-400 flex items-center">
                  <DollarSign className="size-4 -mr-0.5" />
                  {ficha.metricas.totalGastado.toFixed(2)}
                </div>
              </Card>

              <Card className="p-3.5 rounded-[12px] bg-white/5 border border-white/8 space-y-1">
                <span className="text-[11px] text-white/50">Total Citas</span>
                <div className="text-xl font-bold text-white">
                  {ficha.metricas.totalCitas}
                </div>
                <p className="text-[10px] text-white/40">
                  {ficha.metricas.completadas} completadas
                </p>
              </Card>

              <Card className="p-3.5 rounded-[12px] bg-white/5 border border-white/8 space-y-1">
                <span className="text-[11px] text-white/50">Inasistencias</span>
                <div
                  className={`text-xl font-bold ${
                    ficha.metricas.inasistencias >= 2
                      ? 'text-red-400'
                      : ficha.metricas.inasistencias === 1
                      ? 'text-amber-400'
                      : 'text-white'
                  }`}
                >
                  {ficha.metricas.inasistencias}
                </div>
                <p className="text-[10px] text-white/40">
                  {ficha.metricas.canceladas} canceladas
                </p>
              </Card>

              <Card className="p-3.5 rounded-[12px] bg-white/5 border border-white/8 space-y-1">
                <span className="text-[11px] text-white/50">Registrada</span>
                <div className="text-xs font-medium text-white/90 pt-1">
                  {new Date(ficha.clienta.creadaEn).toLocaleDateString('es-SV', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
                <p className="text-[10px] text-white/40">Cliente habitual</p>
              </Card>
            </div>

            {/* 3. Servicios más frecuentes */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
                <Sparkles className="size-3.5" />
                Servicios frecuentes solicitados
              </h3>
              {ficha.metricas.serviciosFrecuentes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {ficha.metricas.serviciosFrecuentes.map((srv) => (
                    <Badge
                      key={srv.nombre}
                      variant="outline"
                      className="border-white/10 bg-white/5 text-white/90 text-xs py-1 px-2.5 flex items-center gap-2"
                    >
                      <span>{srv.nombre}</span>
                      <span className="bg-white/10 px-1.5 py-0.2 rounded-full text-[10px] font-bold text-[var(--primary)]">
                        {srv.cantidad} {srv.cantidad === 1 ? 'vez' : 'veces'}
                      </span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/40 italic">
                  Aún no cuenta con servicios completados registrados.
                </p>
              )}
            </div>

            {/* 4. Notas privadas de la administradora */}
            <div className="space-y-2 p-4 rounded-[12px] bg-white/3 border border-white/8">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                  <Lock className="size-3.5 text-amber-400" />
                  Notas privadas (solo visible para ti)
                </label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGuardarNotas}
                  disabled={guardandoNotas}
                  className="h-7 text-xs border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  {guardandoNotas ? (
                    <>
                      <Loader2 className="size-3 mr-1 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="size-3 mr-1" />
                      Guardar notas
                    </>
                  )}
                </Button>
              </div>
              <textarea
                value={notasPrivadas}
                onChange={(e) => setNotasPrivadas(e.target.value)}
                rows={3}
                placeholder="Añade observaciones privadas sobre preferencias, tonos favoritos, cuidados o acuerdos..."
                className="w-full text-xs p-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
              />
            </div>

            {/* 5. Historial cronológico de citas */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Historial de citas ({ficha.citas.length})
              </h3>

              {ficha.citas.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {ficha.citas.map((cita) => (
                    <div
                      key={cita.id}
                      className="p-3 rounded-lg bg-white/4 border border-white/6 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-medium text-white">
                          {cita.servicios.map((s) => s.nombre).join(', ')}
                        </div>
                        <div className="text-[11px] text-white/50 flex items-center gap-3">
                          <span>{formatearFecha(cita.inicio)}</span>
                          <span>·</span>
                          <span>{cita.duracionTotalMin} min</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold text-white/90">
                          ${(cita.montoCobrado ?? cita.montoTotal).toFixed(2)}
                        </span>
                        {getBadgeEstadoCita(cita.estado)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-white/40 italic">
                  No hay citas registradas en el historial de esta clienta.
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
