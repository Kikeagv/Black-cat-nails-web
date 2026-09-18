/**
 * Configuración general del negocio Black Cat Nails.
 * Valores configurables sin necesidad de alterar la lógica de negocio en domain/.
 */

export const HORARIO = {
  // 0 = domingo … 6 = sábado
  0: { apertura: '09:00', cierre: '17:00' },
  1: { apertura: '14:00', cierre: '20:00' },
  2: { apertura: '14:00', cierre: '20:00' },
  3: { apertura: '14:00', cierre: '20:00' },
  4: { apertura: '14:00', cierre: '20:00' },
  5: { apertura: '14:00', cierre: '20:00' },
  6: { apertura: '09:00', cierre: '17:00' },
} as const;

export type DiaSemana = keyof typeof HORARIO;
export type HorarioDia = { apertura: string; cierre: string };
export type HorarioSemanal = Record<number, HorarioDia>;

export const PREPARACION_MIN = 15;       // tiempo entre citas
export const PASO_BLOQUE_MIN = 30;       // granularidad de los horarios ofrecidos
export const CANCELACION_MIN_HORAS = 12; // anticipación mínima para que la clienta cancele
export const UMBRAL_BAJO = 1.5;          // existencia ≤ mínimo × 1.5 → "bajo"
export const DIAS_CLIENTA_ACTIVA = 60;   // ventana para considerar clienta activa
export const DIAS_AVISO_RETOQUE = 7;     // ventana para alerta de retoque próximo
