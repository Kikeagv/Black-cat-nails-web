import { http } from './http';
import { Usuaria } from '@/types';
import { LoginInput, RegistroInput } from '@/schemas';

/**
 * Servicio de cliente para endpoints de autenticación (BCN-08).
 * Único punto desde la UI para interactuar con /api/auth/*.
 */
export const authService = {
  registro: (datos: RegistroInput): Promise<Usuaria> =>
    http.post<Usuaria>('/api/auth/registro', datos),

  login: (credenciales: LoginInput): Promise<Usuaria> =>
    http.post<Usuaria>('/api/auth/login', credenciales),

  logout: (): Promise<{ ok: boolean; mensaje: string }> =>
    http.post<{ ok: boolean; mensaje: string }>('/api/auth/logout'),

  me: (): Promise<Usuaria> =>
    http.get<Usuaria>('/api/auth/me'),
};

export default authService;
