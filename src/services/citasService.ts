import { http } from './http';
import { Cita, EstadoCita } from '@/types';

/**
 * Servicio de cliente para citas y agendamiento (BCN-16 / BCN-19).
 * Punto único para interactuar con /api/citas/*.
 */
export const citasService = {
  listar: (filtro?: {
    desde?: string;
    hasta?: string;
    estado?: EstadoCita;
    clientaId?: string;
  }): Promise<Cita[]> => {
    const params = new URLSearchParams();
    if (filtro?.desde) params.set('desde', filtro.desde);
    if (filtro?.hasta) params.set('hasta', filtro.hasta);
    if (filtro?.estado) params.set('estado', filtro.estado);
    if (filtro?.clientaId) params.set('clientaId', filtro.clientaId);

    const query = params.toString() ? `?${params.toString()}` : '';
    return http.get<Cita[]>(`/api/citas${query}`);
  },
};

export default citasService;
