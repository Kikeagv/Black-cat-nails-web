import { http } from './http';
import { Usuaria } from '@/types';

/**
 * Servicio de gestión de clientas para panel administrativo
 */
export const clientasService = {
  /**
   * Obtiene la lista de clientas registradas.
   */
  listar: async (): Promise<Usuaria[]> => {
    return http.get<Usuaria[]>('/api/clientas');
  },
};

export default clientasService;
