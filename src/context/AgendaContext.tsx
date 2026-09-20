'use client';

/**
 * CONTEXTO DE AGENDA Y CITAS — BLACK CAT NAILS WEB (BCN-20)
 *
 * Mantiene el estado global de citas y agendamiento según el rol de la usuaria.
 * Permite crear citas, cambiar estados y aplicar filtros por fecha y estado,
 * actualizando el estado local reactivamente sin necesidad de recargar la página.
 *
 * Requisito de la rúbrica DPS941: Context API nativa con providers independientes.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ApiError } from '@/services/http';
import { citasService } from '@/services/citasService';
import { Cita, EstadoCita } from '@/types';
import { AuthContext } from './AuthContext';

export interface FiltrosAgenda {
  desde?: string;
  hasta?: string;
  estado?: EstadoCita;
}

export interface AgendaContextType {
  citas: Cita[];
  cargando: boolean;
  error: string | null;
  filtros: FiltrosAgenda;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosAgenda>>;
  limpiarFiltros: () => void;
  crear: (datos: {
    servicioIds: string[];
    inicio: string;
    notas?: string;
    clientaId?: string;
  }) => Promise<Cita>;
  cambiarEstado: (id: string, nuevoEstado: EstadoCita) => Promise<Cita>;
  recargar: () => Promise<void>;
  cargarCitas: (filtrosPersonalizados?: FiltrosAgenda) => Promise<void>;
}

export const AgendaContext = createContext<AgendaContextType | undefined>(
  undefined
);

export interface AgendaProviderProps {
  children: React.ReactNode;
}

export function AgendaProvider({ children }: AgendaProviderProps) {
  const auth = useContext(AuthContext);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosAgenda>({});

  /**
   * Carga o recarga la lista de citas consultando la API con los filtros vigentes.
   */
  const cargarCitas = useCallback(
    async (filtrosPersonalizados?: FiltrosAgenda): Promise<void> => {
      try {
        setCargando(true);
        setError(null);
        const filtrosAUsar = filtrosPersonalizados ?? filtros;
        const data = await citasService.listar(filtrosAUsar);
        setCitas(data);
      } catch (err: unknown) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al cargar las citas';
        setError(mensaje);
        throw err;
      } finally {
        setCargando(false);
      }
    },
    [filtros]
  );

  /**
   * Recarga las citas utilizando los filtros activos actuales.
   */
  const recargar = useCallback(async (): Promise<void> => {
    await cargarCitas(filtros);
  }, [cargarCitas, filtros]);

  /**
   * Restablece los filtros de búsqueda a vacío.
   */
  const limpiarFiltros = useCallback(() => {
    setFiltros({});
  }, []);

  /**
   * Sincroniza la carga de citas al montar o al alternar la sesión o los filtros.
   */
  useEffect(() => {
    let isMounted = true;

    async function sincronizar() {
      // Esperar a que la autenticación termine de inicializarse
      if (auth && auth.cargando) {
        return;
      }

      // Sin usuaria autenticada, vaciar lista
      if (auth && !auth.usuaria) {
        if (isMounted) {
          setCitas([]);
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
        const data = await citasService.listar(filtros);
        if (isMounted) {
          setCitas(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const mensaje =
            err instanceof Error ? err.message : 'Error al cargar las citas';
          setError(mensaje);
          setCitas([]);
        }
      } finally {
        if (isMounted) {
          setCargando(false);
        }
      }
    }

    sincronizar();

    return () => {
      isMounted = false;
    };
  }, [auth, filtros]);

  /**
   * Crea una nueva cita en el servidor y actualiza la lista local de forma reactiva.
   * Maneja explícitamente el código de error 409 con el mensaje requerido.
   */
  const crear = useCallback(
    async (datos: {
      servicioIds: string[];
      inicio: string;
      notas?: string;
      clientaId?: string;
    }): Promise<Cita> => {
      try {
        setError(null);
        const nuevaCita = await citasService.crear(datos);

        // Actualizar la lista local sin recargar la página
        setCitas((prev) => {
          // Si el filtro activo no coincide, no se agrega a la vista
          if (filtros.estado && nuevaCita.estado !== filtros.estado) {
            return prev;
          }
          if (filtros.desde && nuevaCita.inicio < filtros.desde) {
            return prev;
          }
          if (filtros.hasta && nuevaCita.inicio > filtros.hasta) {
            return prev;
          }

          const actualizadas = [...prev, nuevaCita];
          actualizadas.sort((a, b) => a.inicio.localeCompare(b.inicio));
          return actualizadas;
        });

        return nuevaCita;
      } catch (err: unknown) {
        let mensaje = 'Error al crear la cita';

        if (
          err instanceof ApiError &&
          (err.status === 409 || err.code === 'horario_ocupado')
        ) {
          mensaje =
            'El horario acaba de ocuparse. Por favor, selecciona otro bloque disponible.';
        } else if (err instanceof ApiError) {
          mensaje = err.message;
        } else if (err instanceof Error) {
          mensaje = err.message;
        }

        setError(mensaje);
        throw new Error(mensaje);
      }
    },
    [filtros]
  );

  /**
   * Actualiza el estado de una cita y sincroniza la entidad en el estado local.
   */
  const cambiarEstado = useCallback(
    async (id: string, nuevoEstado: EstadoCita): Promise<Cita> => {
      try {
        setError(null);
        const actualizada = await citasService.cambiarEstado(id, nuevoEstado);

        setCitas((prev) =>
          prev.map((cita) => (cita.id === id ? actualizada : cita))
        );

        return actualizada;
      } catch (err: unknown) {
        const mensaje =
          err instanceof Error
            ? err.message
            : 'Error al cambiar el estado de la cita';
        setError(mensaje);
        throw err;
      }
    },
    []
  );

  const value: AgendaContextType = {
    citas,
    cargando,
    error,
    filtros,
    setFiltros,
    limpiarFiltros,
    crear,
    cambiarEstado,
    recargar,
    cargarCitas,
  };

  return (
    <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>
  );
}

/**
 * Hook de acceso al contexto global de la agenda.
 * Lanza un error claro si se invoca fuera de AgendaProvider.
 */
export function useAgenda(): AgendaContextType {
  const context = useContext(AgendaContext);
  if (!context) {
    throw new Error('useAgenda debe ser utilizado dentro de un AgendaProvider');
  }
  return context;
}
