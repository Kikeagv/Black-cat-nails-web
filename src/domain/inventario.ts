import { UMBRAL_BAJO } from '@/config';
import { ConsumoInsumo, EstadoInsumo, Insumo, Servicio } from '@/types';

/**
 * Agrupa los consumos de insumos de una lista de servicios y suma sus cantidades (RN-04).
 *
 * @param servicios Lista de servicios o de objetos con consumos de insumos
 * @returns Lista consolidada de consumos agrupados por insumoId
 */
export function calcularConsumo(
  servicios: Array<{ consumos?: ConsumoInsumo[] } | Pick<Servicio, 'consumos'>>
): ConsumoInsumo[] {
  const mapa = new Map<string, number>();

  for (const servicio of servicios) {
    if (!servicio || !servicio.consumos) continue;
    for (const item of servicio.consumos) {
      if (!item.insumoId || item.cantidad <= 0) continue;
      const actual = mapa.get(item.insumoId) ?? 0;
      mapa.set(item.insumoId, actual + item.cantidad);
    }
  }

  return Array.from(mapa.entries()).map(([insumoId, cantidad]) => ({
    insumoId,
    cantidad: Number(cantidad.toFixed(2)),
  }));
}

/**
 * Evalúa el semáforo o nivel de criticidad de un insumo de inventario (RN-04).
 *
 * - 'critico': existencia <= minimo
 * - 'bajo':    existencia <= minimo * UMBRAL_BAJO (1.5)
 * - 'ok':      existencia > minimo * UMBRAL_BAJO
 *
 * @param insumo Insumo o registro con existencia y mínimo
 * @returns Estado de criticidad del insumo
 */
export function calcularEstado(
  insumo: Pick<Insumo, 'existencia' | 'minimo'>
): EstadoInsumo {
  if (insumo.existencia <= insumo.minimo) {
    return 'critico';
  }
  if (insumo.existencia <= insumo.minimo * UMBRAL_BAJO) {
    return 'bajo';
  }
  return 'ok';
}

/**
 * Calcula la fecha estimada para el próximo retoque de uñas (RN-03).
 * Se calcula como la fecha de inicio de la cita más el mayor `cicloRetornoDias`
 * de los servicios aplicados.
 *
 * Si ningún servicio tiene un ciclo mayor a 0, retorna undefined.
 *
 * @param inicioIso Cadena ISO de inicio de la cita
 * @param servicios Lista de servicios que pueden incluir cicloRetornoDias
 * @returns Fecha en formato 'YYYY-MM-DD' o undefined si no aplica retoque
 */
export function calcularFechaRetoque(
  inicioIso: string,
  servicios: Array<{ cicloRetornoDias?: number } | Pick<Servicio, 'cicloRetornoDias'>>
): string | undefined {
  if (!servicios || servicios.length === 0) {
    return undefined;
  }

  const ciclos = servicios.map((s) => s.cicloRetornoDias ?? 0);
  const maxCiclo = Math.max(0, ...ciclos);

  if (maxCiclo <= 0) {
    return undefined;
  }

  const fechaBaseStr = inicioIso.slice(0, 10);
  const [year, month, day] = fechaBaseStr.split('-').map(Number);
  if (!year || !month || !day) {
    return undefined;
  }

  const fecha = new Date(Date.UTC(year, month - 1, day));
  fecha.setUTCDate(fecha.getUTCDate() + maxCiclo);

  return fecha.toISOString().slice(0, 10);
}
