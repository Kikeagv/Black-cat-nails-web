'use client';

import React from 'react';
import { Calendar, CreditCard, Users, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { IndicadoresDashboard } from '@/types';
import { Button } from '@/components/ui/button';

interface KpiCardsProps {
  indicadores?: IndicadoresDashboard;
  cargando?: boolean;
  error?: string | null;
  onReintentar?: () => void;
}

export function KpiCards({
  indicadores,
  cargando = false,
  error = null,
  onReintentar,
}: KpiCardsProps) {
  if (cargando) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-[16px] border border-white/8 bg-card/60 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-white/10 rounded-md" />
              <div className="size-9 rounded-full bg-white/10" />
            </div>
            <div className="h-8 w-20 bg-white/10 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[16px] border border-red-500/20 bg-red-500/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <AlertCircle className="size-6 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Error al cargar indicadores clave</p>
            <p className="text-xs text-red-200/70">{error}</p>
          </div>
        </div>
        {onReintentar && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReintentar}
            className="rounded-xl border-white/10 text-xs gap-1.5 h-8 px-3 shrink-0"
          >
            <RefreshCw className="size-3" />
            <span>Reintentar</span>
          </Button>
        )}
      </div>
    );
  }

  if (!indicadores) {
    return null;
  }

  const porcentajeInasistencia = Math.round((indicadores.tasaInasistencia || 0) * 100);

  const kpis = [
    {
      id: 'citas-hoy',
      etiqueta: 'Citas de hoy',
      valor: indicadores.citasHoy.toString(),
      icono: Calendar,
      colorIcono: 'text-[var(--primary)]',
      colorValor: 'text-white',
    },
    {
      id: 'ingresos-mes',
      etiqueta: 'Ingresos del mes',
      valor: `$${indicadores.ingresosMes.toFixed(2)}`,
      icono: CreditCard,
      colorIcono: 'text-emerald-400',
      colorValor: 'text-white',
    },
    {
      id: 'clientas-activas',
      etiqueta: 'Clientas activas',
      valor: indicadores.clientasActivas.toString(),
      icono: Users,
      colorIcono: 'text-[var(--accent)]',
      colorValor: 'text-white',
    },
    {
      id: 'tasa-inasistencia',
      etiqueta: 'Tasa de inasistencia',
      valor: `${porcentajeInasistencia}%`,
      icono: AlertTriangle,
      colorIcono: porcentajeInasistencia > 0 ? 'text-[#f2647d]' : 'text-zinc-400',
      colorValor: porcentajeInasistencia > 0 ? 'text-[#f2647d]' : 'text-white',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icono = kpi.icono;

        return (
          <div
            key={kpi.id}
            className="rounded-[16px] border border-white/8 bg-card/60 backdrop-blur p-6 flex flex-col justify-between gap-4 transition-all hover:border-white/20 shadow-sm"
          >
            {/* Header de la tarjeta */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-white/60">
                {kpi.etiqueta}
              </span>
              <div className="size-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Icono className={`size-4.5 ${kpi.colorIcono}`} />
              </div>
            </div>

            {/* Valor principal */}
            <div className="flex items-baseline gap-2">
              <span className={`font-serif text-3xl sm:text-3xl font-bold tracking-tight ${kpi.colorValor}`}>
                {kpi.valor}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
