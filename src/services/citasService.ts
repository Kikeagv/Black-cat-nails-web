import { http } from './http';
import { Cita, EstadoCita, RespuestaDisponibilidad } from '@/types';

/**
 * Servicio de cliente para citas y agendamiento (BCN-16 / BCN-18 / BCN-19).
 * Punto único para interactuar con /api/citas/* y /api/disponibilidad.
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

  obtenerDisponibilidad: (
    fecha: string,
    servicioIds: string[]
  ): Promise<RespuestaDisponibilidad> => {
    const params = new URLSearchParams({
      fecha,
      servicios: servicioIds.join(','),
    });
    return http.get<RespuestaDisponibilidad>(`/api/disponibilidad?${params.toString()}`);
  },

  crear: (datos: {
    servicioIds: string[];
    inicio: string;
    notas?: string;
    clientaId?: string;
    imagenReferenciaUrl?: string;
  }): Promise<Cita> => {
    return http.post<Cita>('/api/citas', datos);
  },
};

export default citasService;
