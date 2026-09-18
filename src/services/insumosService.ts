import { http } from './http';
import { Insumo } from '@/types';

/**
 * Servicio de cliente para insumos e inventario (BCN-15 / BCN-28).
 */
export const insumosService = {
  listar: (): Promise<Insumo[]> => http.get<Insumo[]>('/api/insumos'),
};

export default insumosService;
