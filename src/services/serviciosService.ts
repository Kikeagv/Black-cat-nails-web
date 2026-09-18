import { http } from './http';
import { Servicio } from '@/types';
import { ActualizarServicioInput, CrearServicioInput } from '@/schemas';

/**
 * Servicio de cliente para el catálogo de servicios (BCN-13).
 * Único punto desde los contextos y componentes UI para interactuar con /api/servicios/*.
 */
export const serviciosService = {
  /**
   * Obtiene la lista de servicios.
   * Clienta recibe solo activos; admin recibe todos o según filtro.
   */
  listar: (filtro?: { activo?: boolean }): Promise<Servicio[]> => {
    const query =
      filtro?.activo !== undefined ? `?activo=${filtro.activo}` : '';
    return http.get<Servicio[]>(`/api/servicios${query}`);
  },

  /**
   * Obtiene el detalle de un servicio por su identificador.
   */
  obtenerPorId: (id: string): Promise<Servicio> =>
    http.get<Servicio>(`/api/servicios/${id}`),

  /**
   * Crea un nuevo servicio (solo admin).
   */
  crear: (datos: CrearServicioInput): Promise<Servicio> =>
    http.post<Servicio>('/api/servicios', datos),

  /**
   * Actualiza parcialmente un servicio existente (solo admin).
   */
  actualizar: (id: string, datos: ActualizarServicioInput): Promise<Servicio> =>
    http.patch<Servicio>(`/api/servicios/${id}`, datos),

  /**
   * Desactiva un servicio vía PATCH de activo = false (solo admin).
   * Nunca elimina físicamente el registro para preservar el historial.
   */
  desactivar: (id: string): Promise<Servicio> =>
    http.patch<Servicio>(`/api/servicios/${id}`, { activo: false }),

  /**
   * Reactiva un servicio vía PATCH de activo = true (solo admin).
   */
  activar: (id: string): Promise<Servicio> =>
    http.patch<Servicio>(`/api/servicios/${id}`, { activo: true }),
};

export default serviciosService;
