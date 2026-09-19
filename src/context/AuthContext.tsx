'use client';

/**
 * CONTEXTO DE AUTENTICACIÓN — BLACK CAT NAILS WEB (BCN-09)
 *
 * Mantiene el estado global de la usuaria autenticada y ofrece métodos para iniciar sesión,
 * registrarse y cerrar sesión comunicándose con la API mediante authService.
 *
 * Requisito de la rúbrica DPS941: Context API nativa de React sin librerías externas.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { LoginInput, RegistroInput } from '@/schemas';
import { authService } from '@/services/authService';
import { Usuaria } from '@/types';

export interface AuthContextType {
  usuaria: Usuaria | null;
  cargando: boolean;
  login: (credenciales: LoginInput) => Promise<Usuaria>;
  registrar: (datos: RegistroInput) => Promise<Usuaria>;
  logout: () => Promise<void>;
  refrescarSesion: () => Promise<Usuaria | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuaria, setUsuaria] = useState<Usuaria | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  const refrescarSesion = useCallback(async (): Promise<Usuaria | null> => {
    try {
      const data = await authService.me();
      setUsuaria(data);
      return data;
    } catch {
      setUsuaria(null);
      return null;
    } finally {
      setCargando(false);
    }
  }, []);

  // Al montar, consulta /api/auth/me para rehidratar la sesión
  useEffect(() => {
    let isMounted = true;

    async function rehidratar() {
      try {
        const data = await authService.me();
        if (isMounted) {
          setUsuaria(data);
        }
      } catch {
        if (isMounted) {
          setUsuaria(null);
        }
      } finally {
        if (isMounted) {
          setCargando(false);
        }
      }
    }

    rehidratar();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credenciales: LoginInput): Promise<Usuaria> => {
    const data = await authService.login(credenciales);
    setUsuaria(data);
    return data;
  }, []);

  const registrar = useCallback(async (datos: RegistroInput): Promise<Usuaria> => {
    const data = await authService.registro(datos);
    setUsuaria(data);
    return data;
  }, []);

  const router = useRouter();

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      setUsuaria(null);
      router.push('/login');
      router.refresh();
    }
  }, [router]);

  const value: AuthContextType = {
    usuaria,
    cargando,
    login,
    registrar,
    logout,
    refrescarSesion,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook personalizado para acceder al estado y acciones de autenticación.
 * Lanza un error explícito si se utiliza fuera de un AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
