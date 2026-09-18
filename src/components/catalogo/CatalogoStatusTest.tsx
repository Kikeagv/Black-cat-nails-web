'use client';

import React, { useState } from 'react';
import { useCatalogo } from '@/context/CatalogoContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles, RefreshCw, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

export function CatalogoStatusTest() {
  const { servicios, cargando, error, crear, alternarActivo, cargarServicios } =
    useCatalogo();
  const { usuaria } = useAuth();
  const [accionando, setAccionando] = useState(false);
  const [mensajeLocal, setMensajeLocal] = useState<string | null>(null);

  const handleCrearPrueba = async () => {
    setAccionando(true);
    setMensajeLocal(null);
    try {
      const sufijo = Math.floor(Math.random() * 900) + 100;
      const nuevo = await crear({
        nombre: `Kapping Gel Demo ${sufijo}`,
        categoria: 'Gel',
        precio: 25,
        duracionMin: 45,
        cicloRetornoDias: 21,
        activo: true,
        consumos: [],
      });
      setMensajeLocal(
        `Servicio "${nuevo.nombre}" creado y agregado a la lista al instante.`
      );
    } catch (err: unknown) {
      setMensajeLocal(
        err instanceof Error ? err.message : 'Error al crear servicio'
      );
    } finally {
      setAccionando(false);
    }
  };

  const handleAlternar = async (id: string, nombre: string) => {
    setAccionando(true);
    setMensajeLocal(null);
    try {
      const res = await alternarActivo(id);
      setMensajeLocal(
        `Servicio "${nombre}" ahora está ${res.activo ? 'activo' : 'inactivo'}.`
      );
    } catch (err: unknown) {
      setMensajeLocal(
        err instanceof Error ? err.message : 'Error al alternar servicio'
      );
    } finally {
      setAccionando(false);
    }
  };

  return (
    <section
      className="space-y-4 pt-4 border-t border-white/10"
      data-testid="catalogo-section"
    >
      <div className="border-b border-white/10 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-display-24 flex items-center gap-2">
          <Sparkles className="size-6 text-[var(--primary)]" />
          <span>Estado Global de Catálogo (BCN-14 · useCatalogo)</span>
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => cargarServicios()}
            disabled={cargando || accionando}
            className="gap-1 text-xs"
          >
            <RefreshCw className={`size-3 ${cargando ? 'animate-spin' : ''}`} />
            Refrescar
          </Button>
          {usuaria?.rol === 'admin' && (
            <Button
              size="sm"
              onClick={handleCrearPrueba}
              disabled={cargando || accionando}
              className="gap-1 text-xs"
            >
              <Plus className="size-3" />
              Crear servicio de prueba
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-300">
          {error}
        </div>
      )}

      {mensajeLocal && (
        <div className="p-3 bg-green-950/40 border border-green-500/30 rounded-lg text-xs text-green-300">
          {mensajeLocal}
        </div>
      )}

      <div className="text-xs text-white/70 flex flex-wrap items-center gap-4">
        <span>
          Total en memoria:{' '}
          <strong className="text-white">{servicios.length}</strong>
        </span>
        <span>
          Cargando:{' '}
          <strong className="text-white">{cargando ? 'Sí' : 'No'}</strong>
        </span>
        <span>
          Sesión:{' '}
          <strong className="text-white">
            {usuaria
              ? `${usuaria.nombre} (${usuaria.rol})`
              : 'Sin sesión activa'}
          </strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {servicios.map((s) => (
          <Card
            key={s.id}
            className="p-3 bg-card/60 border border-white/10 rounded-[12px] flex flex-col justify-between gap-2"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm text-white line-clamp-1">
                  {s.nombre}
                </h4>
                <Badge
                  variant={s.activo ? 'default' : 'secondary'}
                  className="text-[10px] shrink-0"
                >
                  {s.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <p className="text-xs text-white/60 mt-1">
                {s.categoria} · {s.duracionMin} min · ${s.precio.toFixed(2)}
              </p>
            </div>
            {usuaria?.rol === 'admin' && (
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs gap-1 h-7 border border-white/10"
                onClick={() => handleAlternar(s.id, s.nombre)}
                disabled={accionando}
              >
                {s.activo ? (
                  <>
                    <ToggleLeft className="size-3.5 text-yellow-400" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <ToggleRight className="size-3.5 text-green-400" />
                    Activar
                  </>
                )}
              </Button>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
