'use client';

import React from 'react';
import { EstadoInsumo } from '@/types';

interface BarraProgresoMinimoProps {
  existencia: number;
  minimo: number;
  unidad: string;
  estado?: EstadoInsumo;
  compacto?: boolean;
}

/**
 * Componente que renderiza una barra de progreso visual de la existencia de un insumo
 * respecto al umbral mínimo de seguridad (Figura 6).
 *
 * El código de color refleja el estado calculado:
 * - 'critico': rojo (< 100% del mínimo)
 * - 'bajo': ámbar (100% - 150% del mínimo)
 * - 'ok': verde (> 150% del mínimo)
 */
export function BarraProgresoMinimo({
  existencia,
  minimo,
  unidad,
  estado = 'ok',
  compacto = false,
}: BarraProgresoMinimoProps) {
  // Porcentaje real relativo al mínimo de inventario
  const porcentajeReal =
    minimo > 0 ? Math.round((existencia / minimo) * 100) : 100;

  // Ancho visual calibrado: el nivel de seguridad óptimo es 150% del mínimo (UMBRAL_BAJO = 1.5)
  const metaSegura = minimo > 0 ? minimo * 1.5 : 1;
  const porcentajeVisual = Math.min(
    100,
    Math.max(existencia > 0 ? 5 : 0, Math.round((existencia / metaSegura) * 100))
  );

  const getColores = () => {
    switch (estado) {
      case 'critico':
        return {
          bar: 'bg-red-500',
          text: 'text-red-400',
          label: 'Bajo mínimo crítico',
        };
      case 'bajo':
        return {
          bar: 'bg-amber-400',
          text: 'text-amber-400',
          label: 'Próximo a agotarse',
        };
      case 'ok':
      default:
        return {
          bar: 'bg-emerald-500',
          text: 'text-emerald-400',
          label: 'Stock óptimo',
        };
    }
  };

  const estilos = getColores();

  return (
    <div className="w-full space-y-1.5 min-w-[130px] max-w-[200px]">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/80 font-medium">
          {existencia}{' '}
          <span className="text-white/40">
            / {minimo} {unidad}
          </span>
        </span>
        <span className={`font-semibold ${estilos.text}`}>
          {porcentajeReal}%
        </span>
      </div>

      <div
        className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative"
        title={`${estilos.label} (${porcentajeReal}% del mínimo)`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${estilos.bar}`}
          style={{ width: `${porcentajeVisual}%` }}
        />
      </div>

      {!compacto && (
        <div className="flex justify-between items-center text-[10px] text-white/40">
          <span>0</span>
          <span>Mín: {minimo} {unidad}</span>
        </div>
      )}
    </div>
  );
}
