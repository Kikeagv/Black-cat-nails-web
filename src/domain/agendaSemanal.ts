import { HORARIO } from '@/config';

/**
 * Nombres cortos de los días de la semana (Lunes a Domingo).
 */
export const DIAS_SEMANA_CORTOS = [
  { clave: 'Lun', nombre: 'Lunes', diaNumero: 1 },
  { clave: 'Mar', nombre: 'Martes', diaNumero: 2 },
  { clave: 'Mié', nombre: 'Miércoles', diaNumero: 3 },
  { clave: 'Jue', nombre: 'Jueves', diaNumero: 4 },
  { clave: 'Vie', nombre: 'Viernes', diaNumero: 5 },
  { clave: 'Sáb', nombre: 'Sábado', diaNumero: 6 },
  { clave: 'Dom', nombre: 'Domingo', diaNumero: 0 },
] as const;

/**
 * Horas visibles en el gutter lateral de la grilla semanal (09:00 a 20:00).
 */
export const HORAS_GUTTER = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
] as const;

export const HORA_INICIO_GUTTER = 9; // 09:00 AM
export const ALTO_POR_HORA_PX = 60;  // 1 hora = 60 px (1 min = 1 px)

export interface BloqueFueraHorario {
  top: number;
  height: number;
  etiqueta: string;
}

export interface DiaSemanaInfo {
  fecha: Date;
  fechaStr: string; // YYYY-MM-DD
  diaMes: number;   // 24, 25, ...
  claveDia: string; // 'Lun', 'Mar', ...
  nombreCompleto: string; // 'Lunes', 'Martes', ...
  diaSemana: number; // 0 = Dom, 1 = Lun, ..., 6 = Sáb
  esHoy: boolean;
  fueraDeHorario: BloqueFueraHorario[];
}

/**
 * Formatea una fecha local a YYYY-MM-DD de forma segura.
 */
export function formatearFechaYMD(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Obtiene el lunes correspondiente a la semana de la fecha indicada a las 00:00:00.
 */
export function obtenerLunesSemana(fecha: Date): Date {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const diaSemana = d.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  // Si es domingo (0), el lunes fue hace 6 días
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Obtiene el domingo correspondiente al final de la semana iniciada en `lunes`.
 */
export function obtenerDomingoSemana(lunes: Date): Date {
  const d = new Date(lunes);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Nombres abreviados de los meses en español para la cabecera.
 */
const MESES_ABR = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/**
 * Formatea el rango de la semana para la cabecera (ej: "24–30 ago 2026" o "30 ago – 5 sep 2026").
 */
export function formatearRangoSemana(lunes: Date, domingo: Date): string {
  const diaLunes = lunes.getDate();
  const mesLunes = MESES_ABR[lunes.getMonth()];
  const anioLunes = lunes.getFullYear();

  const diaDomingo = domingo.getDate();
  const mesDomingo = MESES_ABR[domingo.getMonth()];
  const anioDomingo = domingo.getFullYear();

  if (lunes.getMonth() === domingo.getMonth()) {
    return `${diaLunes}–${diaDomingo} ${mesLunes} ${anioLunes}`;
  }

  if (anioLunes === anioDomingo) {
    return `${diaLunes} ${mesLunes} – ${diaDomingo} ${mesDomingo} ${anioDomingo}`;
  }

  return `${diaLunes} ${mesLunes} ${anioLunes} – ${diaDomingo} ${mesDomingo} ${anioDomingo}`;
}

/**
 * Calcula los bloques fuera de horario según las reglas de negocio en `HORARIO`.
 * Escala: 09:00 = 0px, 1 hora = 60px.
 */
export function calcularBloquesFueraHorario(diaSemana: number): BloqueFueraHorario[] {
  const regla = HORARIO[diaSemana as keyof typeof HORARIO];
  if (!regla) {
    // Si no hay horario, todo el día está fuera de horario (09:00 a 21:00 = 12h = 720px)
    return [{ top: 0, height: 12 * ALTO_POR_HORA_PX, etiqueta: 'FUERA DE HORARIO' }];
  }

  const [apH, apM] = regla.apertura.split(':').map(Number);
  const [ciH, ciM] = regla.cierre.split(':').map(Number);

  const aperturaMin = apH * 60 + apM;
  const cierreMin = ciH * 60 + ciM;
  const inicioGutterMin = HORA_INICIO_GUTTER * 60; // 09:00 = 540 min
  const finGutterMin = 21 * 60; // 21:00 = 1260 min

  const bloques: BloqueFueraHorario[] = [];

  // Bloque matutino antes de apertura (ej: 09:00 a 14:00 de Lun a Vie)
  if (aperturaMin > inicioGutterMin) {
    const duracionMin = aperturaMin - inicioGutterMin;
    bloques.push({
      top: 0,
      height: duracionMin, // 1 px por min
      etiqueta: 'FUERA DE HORARIO',
    });
  }

  // Bloque nocturno después de cierre (ej: 17:00 a 21:00 en Fin de Semana)
  if (cierreMin < finGutterMin) {
    const top = Math.max(0, cierreMin - inicioGutterMin);
    const height = Math.max(0, finGutterMin - cierreMin);
    if (height > 0) {
      bloques.push({
        top,
        height,
        etiqueta: 'FUERA DE HORARIO',
      });
    }
  }

  return bloques;
}

/**
 * Genera la información completa de los 7 días de la semana a partir del lunes inicial.
 */
export function obtenerDiasSemanaInfo(lunes: Date, fechaHoy?: Date): DiaSemanaInfo[] {
  const hoyStr = formatearFechaYMD(fechaHoy ?? new Date());

  return DIAS_SEMANA_CORTOS.map((def, index) => {
    const fecha = new Date(lunes);
    fecha.setDate(fecha.getDate() + index);

    const fechaStr = formatearFechaYMD(fecha);
    const diaSemana = fecha.getDay();

    return {
      fecha,
      fechaStr,
      diaMes: fecha.getDate(),
      claveDia: def.clave,
      nombreCompleto: def.nombre,
      diaSemana,
      esHoy: fechaStr === hoyStr,
      fueraDeHorario: calcularBloquesFueraHorario(diaSemana),
    };
  });
}

/**
 * Calcula la posición vertical (`top`) y la altura (`height`) de una cita en píxeles.
 * Altura proporcional exacta: 1 minuto = 1 píxel.
 *
 * @param inicioIso Cadena ISO de inicio (ej: "2026-08-25T15:00:00-06:00")
 * @param duracionMinutos Duración total de la cita en minutos
 */
export function calcularPosicionCita(
  inicioIso: string,
  duracionMinutos: number
): { top: number; height: number; horaInicioStr: string; horaFinStr: string } {
  // Extraer hora y minuto directo del ISO para evitar conversiones de zona
  const tiempoParte = inicioIso.split('T')[1] || '09:00';
  const [hStr, mStr] = tiempoParte.slice(0, 5).split(':');
  const hora = parseInt(hStr, 10) || 9;
  const minuto = parseInt(mStr, 10) || 0;

  const inicioMinutos = hora * 60 + minuto;
  const gutterMinutos = HORA_INICIO_GUTTER * 60; // 09:00 = 540 min

  // Desplazamiento desde las 09:00 AM
  const top = Math.max(0, inicioMinutos - gutterMinutos);
  // Restamos 2 px para bordes y separación visual, con mínimo de 36 px
  const height = Math.max(36, duracionMinutos - 2);

  // Formato HH:mm para presentación
  const horaInicioStr = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;

  const finTotalMin = inicioMinutos + duracionMinutos;
  const finHora = Math.floor(finTotalMin / 60);
  const finMin = finTotalMin % 60;
  const horaFinStr = `${String(finHora).padStart(2, '0')}:${String(finMin).padStart(2, '0')}`;

  return {
    top,
    height,
    horaInicioStr,
    horaFinStr,
  };
}
