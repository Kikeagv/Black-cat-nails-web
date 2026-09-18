'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dashboardService } from '@/services/dashboardService';
import { DashboardData } from '@/types';
import { Button } from '@/components/ui/button';
import {
  KpiCards,
  IngresosChart,
  AgendaHoySection,
  AlertasSection,
  DashboardSkeleton,
} from '@/components/admin/dashboard';

/**
 * Formatea una fecha YYYY-MM-DD en texto legible en español según el diseño de Figma:
 * Ejemplo: "Viernes 18 de septiembre, 2026"
 */
function formatearFechaEspanol(fechaStr: string): string {
  const partes = fechaStr.split('-');
  if (partes.length !== 3) return fechaStr;
  const year = parseInt(partes[0], 10);
  const month = parseInt(partes[1], 10) - 1;
  const day = parseInt(partes[2], 10);
  const d = new Date(year, month, day, 12, 0, 0);

  const diasSemana = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];
  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];

  return `${diasSemana[d.getDay()]} ${day} de ${meses[month]}, ${year}`;
}

export default function AdminDashboardPage() {
  const { usuaria } = useAuth();

  // Fecha de referencia por defecto: fecha del seed donde hay citas programadas
  const [fechaReferencia, setFechaReferencia] = useState('2026-09-18');
  const [datos, setDatos] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDashboard = useCallback(async (fecha: string) => {
    try {
      setCargando(true);
      setError(null);
      const res = await dashboardService.obtenerDatos(fecha);
      setDatos(res);
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron obtener los datos del dashboard.'
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    dashboardService
      .obtenerDatos(fechaReferencia)
      .then((res) => {
        if (activo) {
          setDatos(res);
          setError(null);
          setCargando(false);
        }
      })
      .catch((err) => {
        if (activo) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudieron obtener los datos del dashboard.'
          );
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [fechaReferencia]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* 1. Header principal con título y selector de fecha (Figma 31:49) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/8 pb-6">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-white/60">
            Bienvenida, {usuaria?.nombre || 'Administradora'}. Resumen operativo y financiero del negocio.
          </p>
        </div>

        {/* Date picker y botón de recargar */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur text-xs sm:text-sm text-white/80">
            <CalendarIcon className="size-4 text-[var(--accent)] shrink-0" />
            <input
              type="date"
              value={fechaReferencia}
              onChange={(e) => {
                if (e.target.value) {
                  setFechaReferencia(e.target.value);
                }
              }}
              className="bg-transparent text-white focus:outline-hidden font-medium cursor-pointer text-xs sm:text-sm"
              aria-label="Seleccionar fecha de referencia"
            />
            <span className="hidden xl:inline text-white/40 text-xs pl-1">
              ({formatearFechaEspanol(fechaReferencia)})
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => cargarDashboard(fechaReferencia)}
            disabled={cargando}
            className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white gap-1.5 text-xs h-9 px-3"
            title="Actualizar datos"
          >
            <RefreshCw className={`size-3.5 ${cargando ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>
      </div>

      {/* 2. Estados de Carga, Error o Contenido (RNF-03) */}
      {cargando && !datos ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="rounded-[16px] border border-red-500/30 bg-red-500/10 p-8 text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="size-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-white">
              Error al cargar el dashboard
            </h3>
            <p className="text-sm text-red-200/80">{error}</p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => cargarDashboard(fechaReferencia)}
            className="rounded-xl px-5"
          >
            Reintentar
          </Button>
        </div>
      ) : datos ? (
        <div className="space-y-8">
          {/* Tarjetas KPI de RN-05 */}
          <KpiCards indicadores={datos.indicadores} />

          {/* Gráfica de ingresos de las últimas 6 semanas */}
          <IngresosChart datos={datos.ingresosPorSemana} />

          {/* Grilla: Agenda de hoy (60%) y Alertas operativas (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 xl:col-span-8">
              <AgendaHoySection citas={datos.agendaHoy} />
            </div>
            <div className="lg:col-span-5 xl:col-span-4">
              <AlertasSection alertas={datos.alertas} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
