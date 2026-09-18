/**
 * INDICADORES Y MÉTRICAS DEL DASHBOARD — BLACK CAT NAILS WEB (RN-05 / RN-06)
 *
 * Funciones puras de cálculo de indicadores de negocio, agenda del día,
 * series para gráficas y alertas automáticas de inventario y citas.
 *
 * Sin dependencias de base de datos, React ni fetch para permitir
 * su reutilización completa en Etapa 3 (React Native).
 */

import { DIAS_AVISO_RETOQUE, DIAS_CLIENTA_ACTIVA } from '@/config';
import {
  AlertaDashboard,
  Cita,
  CitaAgendaHoy,
  DashboardData,
  IndicadoresDashboard,
  IngresoSemanal,
  Insumo,
  Usuaria,
} from '@/types';
import { ESTADOS_OCUPAN_AGENDA } from './estadosCita';

const MESES_CORTOS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

/**
 * Normaliza cualquier entrada de fecha a un objeto Date seguro.
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
 * Formatea una fecha a YYYY-MM-DD en hora local de forma segura.
 */
function formatearYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

/**
 * Citas de hoy: citas cuyo `inicio` cae hoy en un estado que ocupa agenda o está completada.
 */
export function calcularCitasHoy(
  citas: Cita[],
  fechaReferencia?: Date | string
): number {
  const ref = normalizarFecha(fechaReferencia);
  const hoyStr = formatearYMD(ref);

  return citas.filter((c) => {
    const caeHoy = c.inicio.startsWith(hoyStr);
    const estadoValido =
      ESTADOS_OCUPAN_AGENDA.has(c.estado) || c.estado === 'completada';
    return caeHoy && estadoValido;
  }).length;
}

/**
 * Ingresos del mes: suma de `montoCobrado` exclusivamente de citas `completada` del mes en curso.
 */
export function calcularIngresosMes(
  citas: Cita[],
  fechaReferencia?: Date | string
): number {
  const ref = normalizarFecha(fechaReferencia);
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, '0');
  const mesPrefijo = `${y}-${m}`;

  const total = citas
    .filter((c) => c.estado === 'completada' && c.inicio.startsWith(mesPrefijo))
    .reduce((sum, c) => sum + (c.montoCobrado ?? c.montoTotal), 0);

  return Number(total.toFixed(2));
}

/**
 * Clientas activas: clientas únicas con al menos una cita `completada` en los últimos 60 días.
 */
export function calcularClientasActivas(
  citas: Cita[],
  diasLimite = DIAS_CLIENTA_ACTIVA,
  fechaReferencia?: Date | string
): number {
  const ref = normalizarFecha(fechaReferencia);
  const ahoraMs = ref.getTime();
  const limiteInferiorMs = ahoraMs - diasLimite * 24 * 60 * 60 * 1000;

  const clientasIds = new Set<string>();

  for (const cita of citas) {
    if (cita.estado !== 'completada') continue;

    const inicioMs = new Date(cita.inicio).getTime();
    if (inicioMs >= limiteInferiorMs && inicioMs <= ahoraMs) {
      clientasIds.add(cita.clientaId);
    }
  }

  return clientasIds.size;
}

/**
 * Tasa de inasistencia: `inasistencias / (completadas + inasistencias)` del mes en curso.
 * Si el denominador es 0, devuelve 0 (evita NaN).
 */
export function calcularTasaInasistencia(
  citas: Cita[],
  fechaReferencia?: Date | string
): number {
  const ref = normalizarFecha(fechaReferencia);
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, '0');
  const mesPrefijo = `${y}-${m}`;

  const citasDelMes = citas.filter((c) => c.inicio.startsWith(mesPrefijo));

  const completadas = citasDelMes.filter((c) => c.estado === 'completada').length;
  const inasistencias = citasDelMes.filter((c) => c.estado === 'inasistencia').length;

  const denominador = completadas + inasistencias;
  if (denominador === 0) return 0;

  return Number((inasistencias / denominador).toFixed(2));
}

/**
 * Agenda del día: lista ordenada de citas de hoy que ocupan agenda o completadas.
 */
export function calcularAgendaHoy(
  citas: Cita[],
  usuarias: Usuaria[],
  fechaReferencia?: Date | string
): CitaAgendaHoy[] {
  const ref = normalizarFecha(fechaReferencia);
  const hoyStr = formatearYMD(ref);
  const mapaUsuarias = new Map(usuarias.map((u) => [u.id, u.nombre]));

  const citasHoy = citas.filter((c) => {
    const caeHoy = c.inicio.startsWith(hoyStr);
    const estadoValido =
      ESTADOS_OCUPAN_AGENDA.has(c.estado) || c.estado === 'completada';
    return caeHoy && estadoValido;
  });

  citasHoy.sort((a, b) => a.inicio.localeCompare(b.inicio));

  return citasHoy.map((c) => {
    const hora = c.inicio.slice(11, 16);
    const clienta =
      c.clientaNombre || mapaUsuarias.get(c.clientaId) || 'Clienta';
    const servicios = c.servicios.map((s) => s.nombre).join(', ');

    return {
      id: c.id,
      hora,
      clienta,
      servicios,
      estado: c.estado,
    };
  });
}

/**
 * Ingresos por semana: suma de ingresos de citas completadas agrupada en las últimas 6 semanas.
 */
export function calcularIngresosPorSemana(
  citas: Cita[],
  numSemanas = 6,
  fechaReferencia?: Date | string
): IngresoSemanal[] {
  const ref = normalizarFecha(fechaReferencia);

  // Calcular el lunes de la semana de referencia
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const diaSemana = d.getDay();
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  d.setDate(d.getDate() + diffLunes);
  d.setHours(0, 0, 0, 0);

  // Retroceder numSemanas - 1 semanas para obtener la primera semana de la serie
  const lunesInicial = new Date(d);
  lunesInicial.setDate(lunesInicial.getDate() - (numSemanas - 1) * 7);

  const series: IngresoSemanal[] = [];

  for (let i = 0; i < numSemanas; i++) {
    const lunesSemana = new Date(lunesInicial);
    lunesSemana.setDate(lunesSemana.getDate() + i * 7);

    const domingoSemana = new Date(lunesSemana);
    domingoSemana.setDate(domingoSemana.getDate() + 6);
    domingoSemana.setHours(23, 59, 59, 999);

    const lunesStr = formatearYMD(lunesSemana);
    const domingoStr = formatearYMD(domingoSemana);

    // Etiqueta corta de la semana: ej. "Ago 24"
    const mesNom = MESES_CORTOS[lunesSemana.getMonth()];
    const diaNum = lunesSemana.getDate();
    const etiqueta = `${mesNom} ${diaNum}`;

    const ingresos = citas
      .filter((c) => {
        if (c.estado !== 'completada') return false;
        const fechaCita = c.inicio.slice(0, 10);
        return fechaCita >= lunesStr && fechaCita <= domingoStr;
      })
      .reduce((sum, c) => sum + (c.montoCobrado ?? c.montoTotal), 0);

    series.push({
      semana: etiqueta,
      ingresos: Number(ingresos.toFixed(2)),
    });
  }

  return series;
}

/**
 * Alertas automáticas del sistema:
 * 1. Insumos bajo mínimo (`insumo_bajo`, severidad 'critico').
 * 2. Citas sin confirmar a menos de 24 h (`cita_sin_confirmar`, severidad 'medio').
 * 3. Retoques pendientes dentro de los próximos 7 días sin cita agendada (`retoque_pendiente`, severidad 'bajo').
 */
export function generarAlertas(
  insumos: Insumo[],
  citas: Cita[],
  usuarias: Usuaria[],
  fechaReferencia?: Date | string
): AlertaDashboard[] {
  const ref = normalizarFecha(fechaReferencia);
  const ahoraMs = ref.getTime();
  const hoyStr = formatearYMD(ref);
  const mapaUsuarias = new Map(usuarias.map((u) => [u.id, u.nombre]));

  const alertas: AlertaDashboard[] = [];

  // 1. Alerta de insumos bajo mínimo
  for (const insumo of insumos) {
    if (insumo.existencia <= insumo.minimo) {
      alertas.push({
        tipo: 'insumo_bajo',
        mensaje: `${insumo.nombre}: quedan ${insumo.existencia} ${insumo.unidad} (mínimo ${insumo.minimo})`,
        severidad: 'critico',
      });
    }
  }

  // 2. Alerta de citas sin confirmar a menos de 24 h
  const limite24hMs = ahoraMs + 24 * 60 * 60 * 1000;
  for (const cita of citas) {
    if (cita.estado === 'solicitada') {
      const inicioMs = new Date(cita.inicio).getTime();
      // Si la cita es para hoy o dentro de las próximas 24 h
      if (inicioMs >= ahoraMs - 2 * 60 * 60 * 1000 && inicioMs <= limite24hMs) {
        const clienta =
          cita.clientaNombre || mapaUsuarias.get(cita.clientaId) || 'Clienta';
        const horaStr = cita.inicio.slice(11, 16);
        const fechaCita = cita.inicio.slice(0, 10);
        const cuando = fechaCita === hoyStr ? 'hoy' : 'mañana';

        alertas.push({
          tipo: 'cita_sin_confirmar',
          mensaje: `${clienta} ${cuando} ${horaStr}`,
          severidad: 'medio',
        });
      }
    }
  }

  // 3. Alerta de retoques pendientes (próximos 7 días)
  const dLimiteRetoque = new Date(ref);
  dLimiteRetoque.setDate(dLimiteRetoque.getDate() + DIAS_AVISO_RETOQUE);
  const limiteRetoqueStr = formatearYMD(dLimiteRetoque);

  // Identificar clientas que ya tienen cita futura agendada
  const clientasConCitaFutura = new Set<string>();
  for (const cita of citas) {
    const inicioMs = new Date(cita.inicio).getTime();
    if (
      inicioMs >= ahoraMs &&
      ESTADOS_OCUPAN_AGENDA.has(cita.estado)
    ) {
      clientasConCitaFutura.add(cita.clientaId);
    }
  }

  // Clientas ya notificadas para no duplicar alertas si tienen múltiples citas completadas
  const clientasAlertadasRetoque = new Set<string>();

  for (const cita of citas) {
    if (
      cita.estado === 'completada' &&
      cita.fechaRetoque &&
      !clientasConCitaFutura.has(cita.clientaId) &&
      !clientasAlertadasRetoque.has(cita.clientaId)
    ) {
      if (cita.fechaRetoque >= hoyStr && cita.fechaRetoque <= limiteRetoqueStr) {
        clientasAlertadasRetoque.add(cita.clientaId);
        const clienta =
          cita.clientaNombre || mapaUsuarias.get(cita.clientaId) || 'Clienta';
        alertas.push({
          tipo: 'retoque_pendiente',
          mensaje: `${clienta}: retoque sugerido para el ${cita.fechaRetoque}`,
          severidad: 'bajo',
        });
      }
    }
  }

  return alertas;
}

/**
 * Función consolidadora del dashboard: genera el objeto completo DashboardData
 * a partir de las colecciones del sistema.
 */
export function calcularDashboard(
  citas: Cita[],
  insumos: Insumo[],
  usuarias: Usuaria[],
  fechaReferencia?: Date | string
): DashboardData {
  const ref = normalizarFecha(fechaReferencia);

  const indicadores: IndicadoresDashboard = {
    citasHoy: calcularCitasHoy(citas, ref),
    ingresosMes: calcularIngresosMes(citas, ref),
    clientasActivas: calcularClientasActivas(citas, DIAS_CLIENTA_ACTIVA, ref),
    tasaInasistencia: calcularTasaInasistencia(citas, ref),
  };

  const agendaHoy = calcularAgendaHoy(citas, usuarias, ref);
  const alertas = generarAlertas(insumos, citas, usuarias, ref);
  const ingresosPorSemana = calcularIngresosPorSemana(citas, 6, ref);

  return {
    indicadores,
    agendaHoy,
    alertas,
    ingresosPorSemana,
  };
}
