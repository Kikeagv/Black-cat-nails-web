import { http } from './http';
import { ClientaConMetricas, FichaClientaDetalle } from '@/domain/clientas';
import { ActualizarUsuariaInput } from '@/schemas/usuaria';

export interface FiltrosClientasQuery {
  q?: string;
  filtro?: 'todas' | 'activas' | 'con_inasistencias' | string;
}

/**
 * Servicio de gestión de clientas para panel administrativo (RF-07)
 */
export const clientasService = {
  /**
   * Obtiene la lista de clientas con filtros y métricas calculadas.
   */
  listar: async (filtros?: FiltrosClientasQuery): Promise<ClientaConMetricas[]> => {
    const query = new URLSearchParams();
    if (filtros?.q) {
      query.set('q', filtros.q);
    }
    if (filtros?.filtro && filtros.filtro !== 'todas') {
      query.set('filtro', filtros.filtro);
    }

    const queryStr = query.toString();
    const endpoint = queryStr ? `/api/clientas?${queryStr}` : '/api/clientas';

    return http.get<ClientaConMetricas[]>(endpoint);
  },

  /**
   * Obtiene la ficha individual completa de una clienta con historial y estadísticas.
   */
  obtenerFicha: async (id: string): Promise<FichaClientaDetalle> => {
    return http.get<FichaClientaDetalle>(`/api/clientas/${id}`);
  },

  /**
   * Actualiza datos de contacto y notas privadas de la clienta.
   */
  actualizar: async (
    id: string,
    datos: ActualizarUsuariaInput
  ): Promise<FichaClientaDetalle> => {
    return http.patch<FichaClientaDetalle>(`/api/clientas/${id}`, datos);
  },
};

export default clientasService;
