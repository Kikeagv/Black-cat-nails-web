'use client';

/**
 * CONTEXTO DE INVENTARIO E INSUMOS — BLACK CAT NAILS WEB (RF-06)
 *
 * Mantiene el estado global de los insumos del negocio para rol admin.
 * Permite listar, crear, editar y registrar compras sumando existencias consumiendo
 * exclusivamente `insumosService`, actualizando el estado local de forma reactiva
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
import {
  ActualizarInsumoInput,
  CrearInsumoInput,
  RegistrarCompraInput,
} from '@/schemas';
import { insumosService } from '@/services/insumosService';
import { Insumo } from '@/types';
import { AuthContext } from './AuthContext';

export interface InventarioContextType {
  insumos: Insumo[];
  cargando: boolean;
  error: string | null;
  cargarInsumos: () => Promise<void>;
  crearInsumo: (datos: CrearInsumoInput) => Promise<Insumo>;
  editarInsumo: (id: string, datos: ActualizarInsumoInput) => Promise<Insumo>;
  registrarCompra: (id: string, datos: RegistrarCompraInput) => Promise<Insumo>;
}

export const InventarioContext = createContext<InventarioContextType | undefined>(
  undefined
);

export interface InventarioProviderProps {
  children: React.ReactNode;
}

export function InventarioProvider({ children }: InventarioProviderProps) {
  const auth = useContext(AuthContext);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarInsumos = useCallback(async (): Promise<void> => {
    try {
      setCargando(true);
      setError(null);
      const data = await insumosService.listar();
      setInsumos(data);
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : 'Error al cargar el inventario';
      setError(mensaje);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function inicializar() {
      if (auth && auth.cargando) {
        return;
      }

      // Los insumos son solo para admin
      if (auth && (!auth.usuaria || auth.usuaria.rol !== 'admin')) {
        if (isMounted) {
          setInsumos([]);
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
        const data = await insumosService.listar();
        if (isMounted) {
          setInsumos(data);
        }
      } catch (err) {
        if (isMounted) {
          const mensaje =
            err instanceof Error ? err.message : 'Error al cargar el inventario';
          setError(mensaje);
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

  const crearInsumo = useCallback(
    async (datos: CrearInsumoInput): Promise<Insumo> => {
      try {
        const nuevo = await insumosService.crear(datos);
        setInsumos((prev) => [...prev, nuevo]);
        return nuevo;
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al crear el insumo';
        setError(mensaje);
        throw err;
      }
    },
    []
  );

  const editarInsumo = useCallback(
    async (id: string, datos: ActualizarInsumoInput): Promise<Insumo> => {
      try {
        const actualizado = await insumosService.editar(id, datos);
        setInsumos((prev) =>
          prev.map((item) => (item.id === id ? actualizado : item))
        );
        return actualizado;
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al editar el insumo';
        setError(mensaje);
        throw err;
      }
    },
    []
  );

  const registrarCompra = useCallback(
    async (id: string, datos: RegistrarCompraInput): Promise<Insumo> => {
      try {
        const actualizado = await insumosService.registrarCompra(id, datos);
        setInsumos((prev) =>
          prev.map((item) => (item.id === id ? actualizado : item))
        );
        return actualizado;
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : 'Error al registrar la compra';
        setError(mensaje);
        throw err;
      }
    },
    []
  );

  const value: InventarioContextType = {
    insumos,
    cargando,
    error,
    cargarInsumos,
    crearInsumo,
    editarInsumo,
    registrarCompra,
  };

  return (
    <InventarioContext.Provider value={value}>
      {children}
    </InventarioContext.Provider>
  );
}

export function useInventario(): InventarioContextType {
  const context = useContext(InventarioContext);
  if (!context) {
    throw new Error('useInventario debe usarse dentro de un InventarioProvider');
  }
  return context;
}
