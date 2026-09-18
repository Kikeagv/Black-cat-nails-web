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
    const params = new URLSearchParams();
    if (fecha) params.set('fecha', fecha);
    params.set('_t', Date.now().toString());
    const url = `/api/dashboard?${params.toString()}`;
    return http.get<DashboardData>(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
  },
};

export default dashboardService;
