import { http } from './http';
import { Insumo } from '@/types';
import {
  ActualizarInsumoInput,
  CrearInsumoInput,
  RegistrarCompraInput,
} from '@/schemas';

/**
 * Servicio de cliente para insumos e inventario (RF-06).
 */
export const insumosService = {
  listar: (): Promise<Insumo[]> => http.get<Insumo[]>('/api/insumos'),

  obtenerPorId: (id: string): Promise<Insumo> =>
    http.get<Insumo>(`/api/insumos/${id}`),

  crear: (datos: CrearInsumoInput): Promise<Insumo> =>
    http.post<Insumo>('/api/insumos', datos),

  editar: (id: string, datos: ActualizarInsumoInput): Promise<Insumo> =>
    http.patch<Insumo>(`/api/insumos/${id}`, datos),

  registrarCompra: (id: string, datos: RegistrarCompraInput): Promise<Insumo> =>
    http.patch<Insumo>(`/api/insumos/${id}`, datos),
};

export default insumosService;
