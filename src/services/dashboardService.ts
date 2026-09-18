import { http } from './http';
import { DashboardData } from '@/types';

/**
 * Servicio de métricas y dashboard administrativo (BCN-26)
 */
export const dashboardService = {
  /**
   * Obtiene las métricas consolidadas, agenda de hoy, alertas y series históricas.
   */
  obtenerDatos: async (fecha?: string): Promise<DashboardData> => {
    const url = fecha ? `/api/dashboard?fecha=${encodeURIComponent(fecha)}` : '/api/dashboard';
    return http.get<DashboardData>(url);
  },
};

export default dashboardService;
