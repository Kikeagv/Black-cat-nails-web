'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';
import { IngresoSemanal } from '@/types';

interface IngresosChartProps {
  datos: IngresoSemanal[];
}

export function IngresosChart({ datos }: IngresosChartProps) {
  const totalPeriodo = datos.reduce((acc, curr) => acc + curr.ingresos, 0);

  // Formateador de moneda en dólares
  const formatearDolares = (valor: number) => `$${valor.toFixed(0)}`;

  return (
    <div className="rounded-[16px] border border-white/8 bg-card/60 backdrop-blur p-6 space-y-6">
      {/* Cabecera de la gráfica */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-white">
              Ingresos por semana
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--petal-pink)] border border-[var(--primary)]/30 font-medium">
              Últimas 6 semanas
            </span>
          </div>
          <p className="text-xs sm:text-sm text-white/60">
            Facturación acumulada de citas completadas por período semanal
          </p>
        </div>

        {/* Resumen total */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl self-start sm:self-auto">
          <div className="size-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <DollarSign className="size-4" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-white/50 block font-medium">
              Total 6 semanas
            </span>
            <span className="font-serif font-bold text-base text-emerald-400">
              ${totalPeriodo.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Contenedor Recharts */}
      <div className="h-[280px] w-full pt-2">
        {datos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/50 space-y-2">
            <TrendingUp className="size-8 text-white/30" />
            <p className="text-sm">No hay registros de ingresos para este período.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={datos}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b5446e" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#b5446e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.08)"
                vertical={false}
              />
              <XAxis
                dataKey="semana"
                stroke="rgba(255, 255, 255, 0.4)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                stroke="rgba(255, 255, 255, 0.4)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatearDolares}
                dx={-4}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const ingreso = payload[0].value as number;
                    return (
                      <div className="bg-[#1A1209] border border-white/20 rounded-xl p-3 shadow-xl backdrop-blur">
                        <p className="text-xs text-white/60 font-medium mb-1">
                          Semana: <span className="text-white font-semibold">{label}</span>
                        </p>
                        <p className="text-sm font-bold text-[var(--petal-pink)] flex items-center gap-1">
                          <span>Ingresos:</span>
                          <span className="font-serif text-base text-white">
                            ${ingreso.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="ingresos"
                stroke="#e477c1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorIngresos)"
                activeDot={{
                  r: 6,
                  fill: '#e477c1',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
