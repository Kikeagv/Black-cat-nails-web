'use client';

import React from 'react';
import { Calendar, CreditCard, Users, AlertTriangle } from 'lucide-react';
import { IndicadoresDashboard } from '@/types';

interface KpiCardsProps {
  indicadores: IndicadoresDashboard;
}

export function KpiCards({ indicadores }: KpiCardsProps) {
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
