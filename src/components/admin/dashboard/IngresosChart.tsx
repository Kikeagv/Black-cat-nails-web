'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import { IngresoSemanal } from '@/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Button } from '@/components/ui/button';

interface IngresosChartProps {
  datos?: IngresoSemanal[];
  cargando?: boolean;
  error?: string | null;
  onReintentar?: () => void;
}

const chartConfig = {
  ingresos: {
    label: 'Ingresos',
    color: '#e477c1',
  },
} satisfies ChartConfig;

export function IngresosChart({
  datos = [],
  cargando = false,
  error = null,
  onReintentar,
}: IngresosChartProps) {
  const totalPeriodo = datos.reduce((acc, curr) => acc + curr.ingresos, 0);

  // Formateador de moneda en dólares para el eje Y
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

        {/* Resumen total (solo si hay datos y no está cargando) */}
        {!cargando && !error && (
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
        )}
      </div>

      {/* Cuerpo: Esqueleto de carga, Error por bloque o Gráfica con shadcn */}
      {cargando ? (
        <div className="h-[280px] w-full bg-white/5 rounded-xl flex items-end justify-between p-6 gap-3 animate-pulse" aria-label="Cargando gráfica de ingresos...">
          {[35, 60, 45, 80, 55, 90].map((heightPct, idx) => (
            <div
              key={idx}
              className="w-12 bg-white/10 rounded-t-md"
              style={{ height: `${heightPct}%` }}
            />
          ))}
        </div>
      ) : error ? (
        <div className="h-[280px] w-full rounded-xl border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <AlertCircle className="size-8 text-red-400" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">Error al cargar la gráfica</p>
            <p className="text-xs text-red-200/70 max-w-sm">{error}</p>
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
      ) : datos.length === 0 ? (
        <div className="h-[280px] w-full flex flex-col items-center justify-center text-center p-6 text-white/50 space-y-2">
          <TrendingUp className="size-8 text-white/30" />
          <p className="text-sm">No hay registros de ingresos para este período.</p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-[280px] w-full aspect-auto">
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
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Semana: ${label}`}
                  formatter={(value) => (
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span className="text-white/70">Ingresos</span>
                      <span className="font-serif font-bold text-white">
                        ${Number(value).toFixed(2)}
                      </span>
                    </div>
                  )}
                />
              }
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
        </ChartContainer>
      )}
    </div>
  );
}
