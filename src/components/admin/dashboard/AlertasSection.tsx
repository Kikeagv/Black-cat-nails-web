'use client';

import React from 'react';
import Link from 'next/link';
import { Package, AlertCircle, Clock, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import { AlertaDashboard } from '@/types';
import { Button } from '@/components/ui/button';

interface AlertasSectionProps {
  alertas?: AlertaDashboard[];
  cargando?: boolean;
  error?: string | null;
  onReintentar?: () => void;
}

export function AlertasSection({
  alertas = [],
  cargando = false,
  error = null,
  onReintentar,
}: AlertasSectionProps) {
  const getDetalleTipo = (alerta: AlertaDashboard) => {
    switch (alerta.tipo) {
      case 'insumo_bajo':
        return {
          titulo: alerta.severidad === 'critico' ? 'Insumo agotado / crítico' : 'Insumo bajo',
          icono: Package,
          bgIcono: alerta.severidad === 'critico' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400',
          textColor: alerta.severidad === 'critico' ? 'text-red-400' : 'text-amber-400',
          href: '/admin/inventario',
          destino: 'Ver inventario',
        };
      case 'retoque_pendiente':
        return {
          titulo: 'Retoque pendiente',
          icono: Clock,
          bgIcono: 'bg-[#b5446e]/20 text-[var(--petal-pink)]',
          textColor: 'text-[var(--petal-pink)]',
          href: '/admin/clientas',
          destino: 'Ver clientas',
        };
      default:
        return {
          titulo: 'Aviso',
          icono: AlertCircle,
          bgIcono: 'bg-white/10 text-white',
          textColor: 'text-white',
          href: '/admin',
          destino: 'Ver detalle',
        };
    }
  };

  return (
    <div className="rounded-[16px] border border-white/8 bg-card/60 backdrop-blur p-6 space-y-5 flex flex-col justify-between">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-2 border-b border-white/8 pb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-5 text-amber-400" />
          <h2 className="font-serif text-lg font-bold text-white">
            Alertas
          </h2>
          {!cargando && !error && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                alertas.length > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/5 border border-white/10 text-white/60'
              }`}
            >
              {alertas.length}
            </span>
          )}
        </div>
      </div>

      {/* Contenido: Esqueleto de carga, Error por bloque o Lista de alertas con enlaces */}
      {cargando ? (
        <div className="space-y-3 pt-2 animate-pulse" aria-label="Cargando alertas...">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-[12px] border border-white/8 bg-white/2"
            >
              <div className="size-9 rounded-[8px] bg-white/10 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-20 bg-white/10 rounded-md" />
                <div className="h-4 w-40 bg-white/10 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-8 px-4 rounded-[12px] border border-red-500/20 bg-red-500/5 text-center space-y-3">
          <AlertCircle className="size-8 text-red-400 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">Error al cargar alertas</p>
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
      ) : alertas.length === 0 ? (
        <div className="py-10 px-4 rounded-[12px] border border-dashed border-white/10 bg-white/2 text-center space-y-2">
          <CheckCircle2 className="size-8 text-emerald-400/80 mx-auto" />
          <p className="text-sm font-medium text-white/80">
            No hay alertas operativas
          </p>
          <p className="text-xs text-white/50">
            Sin alertas de inventario ni retoques pendientes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map((alerta, index) => {
            const detalle = getDetalleTipo(alerta);
            const Icono = detalle.icono;

            return (
              <Link
                key={index}
                href={detalle.href}
                className="group flex items-start gap-3 p-3.5 sm:p-4 rounded-[12px] border border-white/8 bg-white/2 hover:bg-white/4 hover:border-white/15 transition-all"
              >
                {/* Icono temático */}
                <div
                  className={`size-9 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5 ${detalle.bgIcono}`}
                >
                  <Icono className="size-5" />
                </div>

                {/* Texto y mensaje */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${detalle.textColor}`}>
                      {detalle.titulo}
                    </span>
                    <ChevronRight className="size-3.5 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <p className="text-sm font-medium text-white/90 truncate">
                    {alerta.mensaje}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
