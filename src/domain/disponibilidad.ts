import { HORARIO, PREPARACION_MIN, PASO_BLOQUE_MIN, HorarioSemanal } from '@/config';
import { EstadoCita, HorarioDisponible, Intervalo } from '@/types';
import { ESTADOS_OCUPAN_AGENDA } from './estadosCita';

/**
 * Suma las duraciones de los servicios seleccionados y añade el tiempo de preparación.
 * Si no hay servicios, devuelve 0 minutos.
 *
 * @param servicios Lista de servicios con su respectiva duración en minutos
 * @returns Duración total estimada en minutos (incluyendo preparación)
 */
export function calcularDuracionTotal(servicios: { duracionMin: number }[]): number {
  if (!servicios || servicios.length === 0) {
    return 0;
  }
  const suma = servicios.reduce((acumulado, s) => acumulado + s.duracionMin, 0);
  return suma + PREPARACION_MIN;
}

/**
 * Convierte un valor de tiempo (HH:mm o ISO 8601) a minutos del día o timestamp numérico
 * para posibilitar comparaciones homogéneas.
 */
function parsearTiempo(valor: string): { tipo: 'minutos' | 'ms' | 'desconocido'; valor: number } {
  // Formato HH:mm o HH:mm:ss
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(valor)) {
    const [h, m] = valor.split(':').map(Number);
    return { tipo: 'minutos', valor: h * 60 + m };
  }

  // Formato fecha ISO 8601
  const ms = Date.parse(valor);
  if (!isNaN(ms)) {
    return { tipo: 'ms', valor: ms };
  }

  return { tipo: 'desconocido', valor: NaN };
}

/**
 * Extrae la hora y minutos de una cadena ISO y los convierte a minutos desde medianoche.
 */
function extraerMinutosDeIso(isoStr: string): number | null {
  const match = isoStr.match(/T(\d{2}):(\d{2})/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    return h * 60 + m;
  }
  return null;
}

/**
 * Determina si dos intervalos de tiempo se solapan.
 * La condición matemática es: a.inicio < b.fin && b.inicio < a.fin.
 * Citas que terminan justo cuando empieza otra NO se cruzan.
 *
 * @param a Primer intervalo
 * @param b Segundo intervalo
 * @returns true si se cruzan, false en caso contrario
 */
export function seCruzan(a: Intervalo, b: Intervalo): boolean {
  const pAIni = parsearTiempo(a.inicio);
  const pAFin = parsearTiempo(a.fin);
  const pBIni = parsearTiempo(b.inicio);
  const pBFin = parsearTiempo(b.fin);

  // Caso 1: Ambos son minutos del día (HH:mm)
  if (pAIni.tipo === 'minutos' && pAFin.tipo === 'minutos' && pBIni.tipo === 'minutos' && pBFin.tipo === 'minutos') {
    return pAIni.valor < pBFin.valor && pBIni.valor < pAFin.valor;
  }

  // Caso 2: Ambos son timestamps en milisegundos (fechas ISO)
  if (pAIni.tipo === 'ms' && pAFin.tipo === 'ms' && pBIni.tipo === 'ms' && pBFin.tipo === 'ms') {
    return pAIni.valor < pBFin.valor && pBIni.valor < pAFin.valor;
  }

  // Caso 3: Uno es HH:mm y el otro es ISO
  const aEsMin = pAIni.tipo === 'minutos' && pAFin.tipo === 'minutos';
  const bEsMin = pBIni.tipo === 'minutos' && pBFin.tipo === 'minutos';

  if (aEsMin && (pBIni.tipo === 'ms' || pBFin.tipo === 'ms')) {
    const bMinIni = extraerMinutosDeIso(b.inicio);
    const bMinFin = extraerMinutosDeIso(b.fin);
    if (bMinIni !== null && bMinFin !== null) {
      return pAIni.valor < bMinFin && bMinIni < pAFin.valor;
    }
  }

  if (bEsMin && (pAIni.tipo === 'ms' || pAFin.tipo === 'ms')) {
    const aMinIni = extraerMinutosDeIso(a.inicio);
    const aMinFin = extraerMinutosDeIso(a.fin);
    if (aMinIni !== null && aMinFin !== null) {
      return aMinIni < pBFin.valor && pBIni.valor < aMinFin;
    }
  }

  // Fallback seguro a comparación lexicográfica directa
  return a.inicio < b.fin && b.inicio < a.fin;
}

/**
 * Convierte una hora en formato "HH:mm" a minutos desde medianoche.
 */
function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convierte minutos desde medianoche a formato "HH:mm".
 */
function minutosAHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export type CitaParaDisponibilidad = Intervalo & { estado?: EstadoCita };

/**
 * Calcula los bloques de horarios candidatos cada 30 minutos para una fecha determinada,
 * indicando si cada bloque está disponible o no.
 *
 * Condiciones para que un bloque esté disponible:
 * 1. Cabe antes del cierre del negocio: inicio + duracionMin <= cierre.
 * 2. No está en el pasado: inicio > ahora.
 * 3. No se cruza con ninguna cita en estado 'solicitada', 'confirmada' o 'en_curso'.
 *
 * @param fecha Fecha en formato 'YYYY-MM-DD'
 * @param duracionMin Duración total requerida en minutos (incluyendo preparación)
 * @param citasDelDia Lista de citas o intervalos registrados para esa fecha
 * @param horarioOAhora Configuración de horarios semanal o fecha de referencia 'ahora'
 * @param posibleAhora Fecha de referencia 'ahora' si el 4to argumento fue la configuración de horarios
 */
export function calcularHorarios(
  fecha: string,
  duracionMin: number,
  citasDelDia: (Intervalo | CitaParaDisponibilidad)[],
  horarioOAhora?: HorarioSemanal | Record<number, { apertura: string; cierre: string }> | Date,
  posibleAhora?: Date,
): HorarioDisponible[] {
  // Resolver argumentos sobrecargados
  let configHorario: Record<number, { apertura: string; cierre: string }> = HORARIO;
  let refAhora: Date | undefined;

  if (horarioOAhora instanceof Date) {
    refAhora = horarioOAhora;
  } else if (horarioOAhora) {
    configHorario = horarioOAhora;
    refAhora = posibleAhora;
  } else {
    refAhora = posibleAhora;
  }

  if (refAhora === undefined) {
    refAhora = new Date();
  }

  // 1. Obtener día de la semana de forma independiente de la zona horaria del host
  const [year, month, day] = fecha.split('-').map(Number);
  if (!year || !month || !day) {
    return [];
  }
  const diaSemana = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  const configuracionDia = configHorario[diaSemana];
  if (!configuracionDia || !configuracionDia.apertura || !configuracionDia.cierre) {
    return [];
  }

  const { apertura, cierre } = configuracionDia;
  const aperturaMin = horaAMinutos(apertura);
  const cierreMin = horaAMinutos(cierre);

  // 2. Validación de fecha pasada (en El Salvador la zona horaria fija es UTC-6)
  const ahoraMs = refAhora.getTime();
  const ahoraElSalvadorMs = ahoraMs - 6 * 60 * 60 * 1000;
  const hoyElSalvador = new Date(ahoraElSalvadorMs).toISOString().slice(0, 10);

  if (fecha < hoyElSalvador) {
    return []; // Fecha pasada -> lista vacía
  }

  // Si es el día de hoy y ya pasó la hora de cierre del día -> lista vacía
  const cierreHoyMs = Date.parse(`${fecha}T${cierre}:00-06:00`);
  if (fecha === hoyElSalvador && ahoraMs >= cierreHoyMs) {
    return [];
  }

  // 3. Filtrar citas que ocupan agenda (solicitada, confirmada, en_curso o sin estado explícito)
  const citasOcupadas = citasDelDia.filter((cita) => {
    if ('estado' in cita && cita.estado !== undefined) {
      return ESTADOS_OCUPAN_AGENDA.has(cita.estado);
    }
    return true;
  });

  // 4. Generar candidatos cada PASO_BLOQUE_MIN desde apertura hasta cierre
  const resultado: HorarioDisponible[] = [];

  for (let minActual = aperturaMin; minActual < cierreMin; minActual += PASO_BLOQUE_MIN) {
    const hora = minutosAHora(minActual);
    const horaFinMin = minActual + duracionMin;
    const horaFin = minutosAHora(horaFinMin);

    // Condición 1: Cabe antes del cierre
    const cabeAntesDeCierre = duracionMin > 0 && horaFinMin <= cierreMin;

    // Condición 2: No está en el pasado (inicio > ahora)
    const inicioMs = Date.parse(`${fecha}T${hora}:00-06:00`);
    const noEstaEnElPasado = inicioMs > ahoraMs;

    // Condición 3: No se cruza con citas existentes
    const bloqueCandidato: Intervalo = {
      inicio: `${fecha}T${hora}:00-06:00`,
      fin: `${fecha}T${horaFin}:00-06:00`,
    };

    const hayCruce = citasOcupadas.some((cita) => seCruzan(bloqueCandidato, cita));

    const disponible = cabeAntesDeCierre && noEstaEnElPasado && !hayCruce;

    resultado.push({
      hora,
      disponible,
    });
  }

  return resultado;
}
