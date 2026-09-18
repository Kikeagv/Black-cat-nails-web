'use client';

/**
 * CONTEXTO DE CATÁLOGO DE SERVICIOS — BLACK CAT NAILS WEB (BCN-14)
 *
 * Mantiene el estado global de los servicios disponibles según el rol de la usuaria.
 * Permite crear, editar y alternar la disponibilidad de servicios consumiendo
 * exclusivamente `serviciosService`, actualizando el estado local de forma reactiva
 * sin recargar la página.
 *
 * Requisito de la rúbrica DPS941: Context API nativa de React.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ActualizarServicioInput, CrearServicioInput } from '@/schemas';
import { serviciosService } from '@/services/serviciosService';
import { Servicio } from '@/types';
import { AuthContext } from './AuthContext';

export interface CatalogoContextType {
  servicios: Servicio[];
  cargando: boolean;
  error: string | null;
  crear: (datos: CrearServicioInput) => Promise<Servicio>;
  editar: (id: string, datos: ActualizarServicioInput) => Promise<Servicio>;
  alternarActivo: (id: string, activoDeseado?: boolean) => Promise<Servicio>;
  cargarServicios: () => Promise<void>;
}

export const CatalogoContext = createContext<CatalogoContextType | undefined>(
  undefined
);

export interface CatalogoProviderProps {
  children: React.ReactNode;
}

export function CatalogoProvider({ children }: CatalogoProviderProps) {
  const auth = useContext(AuthContext);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Recarga la lista de servicios desde la API mediante serviciosService.
   */
  const cargarServicios = useCallback(async (): Promise<void> => {
    try {
      setCargando(true);
      setError(null);
      const data = await serviciosService.listar();
      setServicios(data);
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : 'Error al cargar los servicios';
      setError(mensaje);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  /**
   * Carga inicial al montar o al cambiar la sesión de la usuaria.
   */
  useEffect(() => {
    let isMounted = true;

    async function inicializar() {
      // Si AuthContext está presente y aún comprobando sesión, esperamos
      if (auth && auth.cargando) {
        return;
      }

      // Si AuthContext está presente y no hay sesión activa, no llamamos a la API
      if (auth && !auth.usuaria) {
        if (isMounted) {
          setServicios([]);
          setCargando(false);
          setError(null);
        }
        return;
      }

      try {
        if (isMounted) {
          setCargando(true);
          setError(null);
        }
        const data = await serviciosService.listar();
        if (isMounted) {
          setServicios(data);
        }
      } catch (err) {
        if (isMounted) {
          const mensaje =
            err instanceof Error ? err.message : 'Error al cargar los servicios';
          setError(mensaje);
          setServicios([]);
        }
      } finally {
        if (isMounted) {
          setCargando(false);
        }
      }
    }

    inicializar();

    return () => {
      isMounted = false;
    };
  }, [auth]);

  /**
   * Crea un nuevo servicio y lo agrega inmediatamente al estado local.
   */
  const crear = useCallback(
    async (datos: CrearServicioInput): Promise<Servicio> => {
      try {
        setError(null);
        const nuevo = await serviciosService.crear(datos);
        setServicios((prev) => [...prev, nuevo]);
        return nuevo;
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al crear el servicio';
        setError(mensaje);
        throw err;
      }
    },
    []
  );

  /**
   * Edita un servicio y actualiza la entidad en el estado local.
   */
  const editar = useCallback(
    async (id: string, datos: ActualizarServicioInput): Promise<Servicio> => {
      try {
        setError(null);
        const actualizado = await serviciosService.actualizar(id, datos);
        setServicios((prev) =>
          prev.map((s) => (s.id === id ? actualizado : s))
        );
        return actualizado;
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al editar el servicio';
        setError(mensaje);
        throw err;
      }
    },
    []
  );

  /**
   * Alterna o establece el estado activo/inactivo de un servicio.
   * Utiliza serviciosService.activar / desactivar (PATCH { activo: boolean }).
   */
  const alternarActivo = useCallback(
    async (id: string, activoDeseado?: boolean): Promise<Servicio> => {
      try {
        setError(null);
        const actual = servicios.find((s) => s.id === id);
        const nuevoEstado =
          activoDeseado !== undefined
            ? activoDeseado
            : actual
              ? !actual.activo
              : false;

        const actualizado = nuevoEstado
          ? await serviciosService.activar(id)
          : await serviciosService.desactivar(id);

        setServicios((prev) =>
          prev.map((s) => (s.id === id ? actualizado : s))
        );
        return actualizado;
      } catch (err) {
        const mensaje =
          err instanceof Error
            ? err.message
            : 'Error al cambiar el estado del servicio';
        setError(mensaje);
        throw err;
      }
    },
    [servicios]
  );

  const value: CatalogoContextType = {
    servicios,
    cargando,
    error,
    crear,
    editar,
    alternarActivo,
    cargarServicios,
  };

  return (
    <CatalogoContext.Provider value={value}>
      {children}
    </CatalogoContext.Provider>
  );
}

/**
 * Hook personalizado para acceder al contexto del catálogo de servicios.
 * Lanza un error explícito si se utiliza fuera de un CatalogoProvider.
 */
export function useCatalogo(): CatalogoContextType {
  const context = useContext(CatalogoContext);
  if (!context) {
    throw new Error(
      'useCatalogo debe ser utilizado dentro de un CatalogoProvider'
    );
  }
  return context;
}
