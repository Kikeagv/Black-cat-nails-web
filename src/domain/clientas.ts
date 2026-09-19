/**
 * REGLAS DE NEGOCIO Y CÁLCULOS DE CLIENTAS — BLACK CAT NAILS WEB (RF-07)
 *
 * Funciones puras para el cálculo de métricas de clientas, historial,
 * servicios frecuentes y detección de inasistencias.
 *
 * Sin dependencias de base de datos ni React para permitir su reutilización
 * en la Etapa 3 (React Native).
 */

import { DIAS_CLIENTA_ACTIVA } from '@/config';
import { Cita, Usuaria } from '@/types';

export interface ServicioFrecuente {
  nombre: string;
  cantidad: number;
  montoTotal: number;
}

export interface MetricasClienta {
  totalGastado: number;
  totalCitas: number;
  completadas: number;
  canceladas: number;
  inasistencias: number;
  futuras: number;
  serviciosFrecuentes: ServicioFrecuente[];
  esActiva: boolean;
  alertaInasistencias: boolean; // >= 2 inasistencias acumuladas
  ultimaCitaFecha?: string;
  proximaCitaFecha?: string;
}

export interface ClientaConMetricas extends Usuaria {
  metricas: MetricasClienta;
}

export interface FichaClientaDetalle {
  clienta: Usuaria;
  metricas: MetricasClienta;
  citas: Cita[];
}

/**
 * Normaliza una fecha a Date de forma segura.
 */
function normalizarFecha(fecha?: Date | string): Date {
  if (!fecha) return new Date();
  if (typeof fecha === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const [y, m, d] = fecha.split('-').map(Number);
      return new Date(y, m - 1, d, 12, 0, 0);
    }
    return new Date(fecha);
  }
  return new Date(fecha.getTime());
}

/**
 * Determina si una clienta está activa (ha tenido al menos una cita completada
 * en los últimos 60 días según la regla RN-05 / DIAS_CLIENTA_ACTIVA).
 */
export function esClientaActiva(
  citasDeLaClienta: Cita[],
  diasLimite = DIAS_CLIENTA_ACTIVA,
  fechaReferencia?: Date | string
): boolean {
  const ref = normalizarFecha(fechaReferencia);
  const ahoraMs = ref.getTime();
  const limiteInferiorMs = ahoraMs - diasLimite * 24 * 60 * 60 * 1000;

  return citasDeLaClienta.some((c) => {
    if (c.estado !== 'completada') return false;
    const inicioMs = new Date(c.inicio).getTime();
    return inicioMs >= limiteInferiorMs && inicioMs <= ahoraMs;
  });
}

/**
 * Calcula las métricas consolidadas de una clienta en base a sus citas registradas.
 */
export function calcularMetricasClienta(
  clienta: Usuaria,
  citasDeLaClienta: Cita[],
  fechaReferencia?: Date | string
): MetricasClienta {
  const ref = normalizarFecha(fechaReferencia);
  const ahoraMs = ref.getTime();

  let totalGastado = 0;
  let completadas = 0;
  let canceladas = 0;
  let inasistenciasEnCitas = 0;
  let futuras = 0;

  const contadorServicios = new Map<
    string,
    { cantidad: number; montoTotal: number }
  >();

  // Citas ordenadas por fecha de inicio
  const citasOrdenadas = [...citasDeLaClienta].sort((a, b) =>
    a.inicio.localeCompare(b.inicio)
  );

  let ultimaCitaFecha: string | undefined;
  let proximaCitaFecha: string | undefined;

  for (const cita of citasOrdenadas) {
    const inicioMs = new Date(cita.inicio).getTime();

    if (cita.estado === 'completada') {
      completadas++;
      const cobrado = cita.montoCobrado ?? cita.montoTotal ?? 0;
      totalGastado += cobrado;
      ultimaCitaFecha = cita.inicio;

      // Acumular servicios consumidos
      for (const s of cita.servicios) {
        const item = contadorServicios.get(s.nombre) ?? {
          cantidad: 0,
          montoTotal: 0,
        };
        item.cantidad += 1;
        item.montoTotal += s.precio ?? 0;
        contadorServicios.set(s.nombre, item);
      }
    } else if (cita.estado === 'inasistencia') {
      inasistenciasEnCitas++;
    } else if (cita.estado === 'cancelada') {
      canceladas++;
    } else if (
      inicioMs >= ahoraMs &&
      (cita.estado === 'solicitada' || cita.estado === 'confirmada')
    ) {
      futuras++;
      if (!proximaCitaFecha) {
        proximaCitaFecha = cita.inicio;
      }
    }
  }

  // Lista de servicios frecuentes ordenada de mayor a menor cantidad
  const serviciosFrecuentes: ServicioFrecuente[] = Array.from(
    contadorServicios.entries()
  )
    .map(([nombre, stats]) => ({
      nombre,
      cantidad: stats.cantidad,
      montoTotal: Number(stats.montoTotal.toFixed(2)),
    }))
    .sort((a, b) => b.cantidad - a.cantidad || b.montoTotal - a.montoTotal);

  const esActiva = esClientaActiva(citasDeLaClienta, DIAS_CLIENTA_ACTIVA, ref);
  const inasistenciasTotales = Math.max(
    clienta.inasistencias || 0,
    inasistenciasEnCitas
  );
  const alertaInasistencias = inasistenciasTotales >= 2;

  return {
    totalGastado: Number(totalGastado.toFixed(2)),
    totalCitas: citasDeLaClienta.length,
    completadas,
    canceladas,
    inasistencias: inasistenciasTotales,
    futuras,
    serviciosFrecuentes,
    esActiva,
    alertaInasistencias,
    ultimaCitaFecha,
    proximaCitaFecha,
  };
}
