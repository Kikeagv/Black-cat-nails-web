import { CANCELACION_MIN_HORAS } from '@/config';
import { EstadoCita, Rol } from '@/types';

/**
 * Mapa de transiciones válidas de la máquina de estados de una cita (RN-02).
 */
export const TRANSICIONES: Record<EstadoCita, EstadoCita[]> = {
  solicitada: ['confirmada', 'cancelada', 'inasistencia'],
  confirmada: ['en_curso', 'cancelada', 'inasistencia'],
  en_curso: ['completada'],
  completada: [],
  cancelada: [],
  inasistencia: [],
};

/**
 * Conjunto inmutable de estados de cita que reservan espacio en la agenda (RN-01 / RN-02).
 * Cancelada e inasistencia liberan el bloque horario.
 */
export const ESTADOS_OCUPAN_AGENDA: ReadonlySet<EstadoCita> = new Set<EstadoCita>([
  'solicitada',
  'confirmada',
  'en_curso',
]);

/**
 * Etiquetas legibles de los estados para la interfaz de usuaria.
 */
export const ETIQUETAS_ESTADO: Record<EstadoCita, string> = {
  solicitada: 'Solicitada',
  confirmada: 'Confirmada',
  en_curso: 'En curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
  inasistencia: 'Inasistencia',
};

/**
 * Determina si una transición de estado es válida según el grafo de la máquina de estados,
 * sin considerar aún el rol ni la anticipación temporal.
 */
export function esTransicionValida(desde: EstadoCita, hacia: EstadoCita): boolean {
  const permitidas = TRANSICIONES[desde] ?? [];
  return permitidas.includes(hacia);
}

/**
 * Evalúa si una usuaria con un rol determinado puede ejecutar la transición entre estados (RN-02).
 *
 * - Admin: puede realizar cualquier transición permitida por la máquina de estados.
 * - Clienta: solo puede confirmar ('confirmada') o cancelar ('cancelada') su cita.
 *
 * @param desde Estado actual de la cita
 * @param hacia Estado destino solicitado
 * @param rol Rol de la usuaria que ejecuta la acción ('admin' o 'clienta')
 * @returns true si la transición está permitida para el rol, false en caso contrario
 */
export function puedeTransicionar(
  desde: EstadoCita,
  hacia: EstadoCita,
  rol: Rol
): boolean {
  if (!esTransicionValida(desde, hacia)) {
    return false;
  }

  if (rol === 'admin') {
    return true;
  }

  if (rol === 'clienta') {
    return hacia === 'confirmada' || hacia === 'cancelada';
  }

  return false;
}

/**
 * Verifica si la cancelación se solicita con la anticipación mínima requerida (RN-02).
 * Por defecto 12 horas (CANCELACION_MIN_HORAS).
 *
 * @param inicioIso Cadena ISO de inicio de la cita
 * @param minHoras Número mínimo de horas de antelación requeridas
 * @param ahora Fecha de referencia (por defecto la actual)
 */
export function cumpleAnticipacionCancelacion(
  inicioIso: string,
  minHoras: number = CANCELACION_MIN_HORAS,
  ahora: Date = new Date()
): boolean {
  const inicioMs = Date.parse(inicioIso);
  if (isNaN(inicioMs)) {
    return false;
  }
  const horasAnticipacion = (inicioMs - ahora.getTime()) / (1000 * 60 * 60);
  return horasAnticipacion >= minHoras;
}

export type CodigoErrorTransicion =
  | 'transicion_invalida'
  | 'permiso_insuficiente'
  | 'cancelacion_tardia';

export interface ResultadoValidacionTransicion {
  valida: boolean;
  status?: 403 | 422;
  codigo?: CodigoErrorTransicion;
  mensaje?: string;
}

/**
 * Diagnóstico detallado para el endpoint de cambio de estado.
 * Identifica la causa exacta del fallo para devolver el código HTTP correcto:
 * - 422 transicion_invalida: Si la máquina de estados no permite pasar de `desde` a `hacia`.
 * - 403 permiso_insuficiente: Si la transición es estructuralmente válida pero reservada a admin.
 * - 422 cancelacion_tardia: Si la clienta cancela con menos de 12h de anticipación.
 */
export function validarTransicionEstado(
  desde: EstadoCita,
  hacia: EstadoCita,
  rol: Rol,
  inicioCitaIso?: string,
  ahora: Date = new Date()
): ResultadoValidacionTransicion {
  // 1. Validar máquina de estados general
  if (!esTransicionValida(desde, hacia)) {
    return {
      valida: false,
      status: 422,
      codigo: 'transicion_invalida',
      mensaje: `No se puede pasar de "${desde}" a "${hacia}"`,
    };
  }

  // 2. Validar permisos por rol
  if (rol === 'clienta') {
    if (hacia === 'en_curso' || hacia === 'completada' || hacia === 'inasistencia') {
      return {
        valida: false,
        status: 403,
        codigo: 'permiso_insuficiente',
        mensaje: 'Solo la administradora puede realizar esta acción',
      };
    }

    // 3. Validar anticipación de cancelación para clientas
    if (hacia === 'cancelada' && inicioCitaIso) {
      if (!cumpleAnticipacionCancelacion(inicioCitaIso, CANCELACION_MIN_HORAS, ahora)) {
        return {
          valida: false,
          status: 422,
          codigo: 'cancelacion_tardia',
          mensaje: `Las cancelaciones deben realizarse con al menos ${CANCELACION_MIN_HORAS} horas de anticipación`,
        };
      }
    }
  }

  return { valida: true };
}
