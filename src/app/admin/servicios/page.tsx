'use client';

/**
 * ADMINISTRACIÓN DEL CATÁLOGO DE SERVICIOS — BLACK CAT NAILS WEB (BCN-15)
 *
 * Módulo administrativo principal (RF-02) con diseño inspirado en la Figura 6:
 * - Tabla completa: nombre, categoría, precio, duración, ciclo de retorno, insumos y estado.
 * - Diálogo unificado para crear y editar servicios.
 * - Selector dinámico de consumos de insumos con cantidades.
 * - Diálogo de confirmación antes de desactivar.
 * - Estados de carga (esqueleto), lista vacía y error con reintento.
 * - Búsqueda en vivo y filtros por categoría y estado de disponibilidad.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Plus,
  Pencil,
  PowerOff,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Clock,
  Package,
} from 'lucide-react';
import { useCatalogo } from '@/context/CatalogoContext';
import { Insumo, Servicio } from '@/types';
import { insumosService } from '@/services/insumosService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { ServicioFormDialog } from '@/components/admin/servicios/ServicioFormDialog';
import { DesactivarConfirmDialog } from '@/components/admin/servicios/DesactivarConfirmDialog';

export default function AdminServiciosPage() {
  const { servicios, cargando, error, alternarActivo, cargarServicios } = useCatalogo();

  // Estados locales para insumos disponibles desde la API de inventario
  const [insumos, setInsumos] = useState<Insumo[]>([]);

  // Estados para diálogos
  const [dialogoFormAbierto, setDialogoFormAbierto] = useState(false);
  const [servicioEditando, setServicioEditando] = useState<Servicio | null>(null);

  const [dialogoDesactivarAbierto, setDialogoDesactivarAbierto] = useState(false);
  const [servicioADesactivar, setServicioADesactivar] = useState<Servicio | null>(null);

  // Estados para búsqueda y filtrado
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  // Cargar insumos para el formulario
  useEffect(() => {
    let activo = true;
    insumosService
      .listar()
      .then((datos) => {
        if (activo && Array.isArray(datos)) {
          setInsumos(datos);
        }
      })
      .catch(() => {
        // En caso de fallo de red de insumos, se mantiene el catálogo de insumos vacío
      });

    return () => {
      activo = false;
    };
  }, []);

  // Lista de categorías únicas presentes en los servicios
  const categoriasDisponibles = useMemo(() => {
    const cats = new Set(servicios.map((s) => s.categoria));
    return ['todas', ...Array.from(cats)];
  }, [servicios]);

  // Filtrado de servicios
  const serviciosFiltrados = useMemo(() => {
    return servicios.filter((s) => {
      const coincideBusqueda =
        busqueda.trim() === '' ||
        s.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()) ||
        s.categoria.toLowerCase().includes(busqueda.toLowerCase().trim());

      const coincideCategoria =
        filtroCategoria === 'todas' || s.categoria === filtroCategoria;

      const coincideEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'activos' && s.activo) ||
        (filtroEstado === 'inactivos' && !s.activo);

      return coincideBusqueda && coincideCategoria && coincideEstado;
    });
  }, [servicios, busqueda, filtroCategoria, filtroEstado]);

  // Abrir diálogo de creación
  const handleCrearNuevo = () => {
    setServicioEditando(null);
    setDialogoFormAbierto(true);
  };

  // Abrir diálogo de edición
  const handleEditar = (servicio: Servicio) => {
    setServicioEditando(servicio);
    setDialogoFormAbierto(true);
  };

  // Solicitar desactivación con confirmación previa
  const handleSolicitarDesactivar = (servicio: Servicio) => {
    setServicioADesactivar(servicio);
    setDialogoDesactivarAbierto(true);
  };

  // Reactivar directamente (sin confirmación destructiva)
  const handleReactivar = async (servicio: Servicio) => {
    try {
      await alternarActivo(servicio.id, true);
      toast.success(`Servicio "${servicio.nombre}" reactivado con éxito`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Error al reactivar el servicio'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Encabezado principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-display-32 font-serif text-white text-balance">
          Catálogo de Servicios
        </h1>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={() => cargarServicios()}
            disabled={cargando}
            className="h-11 md:h-10 text-xs gap-1.5 border-white/15 hover:bg-white/10"
          >
            <RefreshCw className={`size-3.5 ${cargando ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </Button>
          <Button
            size="default"
            onClick={handleCrearNuevo}
            className="h-11 md:h-10 text-xs gap-1.5 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 shadow-md"
          >
            <Plus className="size-4" />
            <span>Nuevo servicio</span>
          </Button>
        </div>
      </div>

      {/* 2. Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card/40 p-3 rounded-[16px] border border-white/10">
        <SearchInput
          containerClassName="flex-1"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o categoría..."
        />

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro categoría */}
          <NativeSelect
            size="sm"
            className="w-full sm:w-[190px]"
            aria-label="Filtrar por categoría"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            {categoriasDisponibles.map((cat) => (
              <NativeSelectOption key={cat} value={cat} className="capitalize">
                {cat === 'todas' ? 'Todas las categorías' : cat}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          {/* Filtro estado */}
          <NativeSelect
            size="sm"
            className="w-full sm:w-[160px]"
            aria-label="Filtrar por estado"
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(e.target.value as 'todos' | 'activos' | 'inactivos')
            }
          >
            <NativeSelectOption value="todos">
              Todos los estados
            </NativeSelectOption>
            <NativeSelectOption value="activos">
              Solo activos
            </NativeSelectOption>
            <NativeSelectOption value="inactivos">
              Solo inactivos
            </NativeSelectOption>
          </NativeSelect>
        </div>
      </div>

      {/* 3. Estado de error con reintento */}
      {error && (
        <div className="p-4 rounded-[16px] bg-red-950/40 border border-red-500/30 flex items-center justify-between gap-3 text-sm text-red-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => cargarServicios()}
            className="text-xs border-red-400/40 hover:bg-red-950/60 shrink-0"
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* 4. Tabla de servicios y estados */}
      <Card className="rounded-[16px] border border-white/8 bg-card/60 backdrop-blur overflow-hidden py-0">
        {cargando ? (
          /* Estado de carga con esqueleto visual */
          <div className="p-6 space-y-4">
            <div className="h-6 bg-white/10 rounded w-1/4 animate-pulse" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-white/5 rounded-[8px] animate-pulse flex items-center justify-between px-4"
                >
                  <div className="w-1/3 h-4 bg-white/10 rounded" />
                  <div className="w-1/6 h-4 bg-white/10 rounded" />
                  <div className="w-1/6 h-4 bg-white/10 rounded" />
                  <div className="w-1/6 h-4 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : servicios.length === 0 ? (
          /* Estado de lista vacía */
          <div className="p-12 text-center space-y-4">
            <div className="size-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[var(--accent)]">
              <Sparkles className="size-8" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-lg font-semibold text-white">
                No hay servicios registrados
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                El catálogo está vacío. Agregá el primer servicio para que las clientas
                puedan comenzar a agendar citas en línea.
              </p>
            </div>
            <Button
              onClick={handleCrearNuevo}
              className="text-xs gap-1.5 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
            >
              <Plus className="size-4" />
              Crear primer servicio
            </Button>
          </div>
        ) : serviciosFiltrados.length === 0 ? (
          /* Filtros sin coincidencia */
          <div className="p-8 text-center space-y-2">
            <p className="text-sm text-white/80 font-medium">
              No se encontraron servicios que coincidan con los filtros aplicados.
            </p>
            <p className="text-xs text-white/50">
              Probá limpiando el buscador o cambiando la categoría seleccionada.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBusqueda('');
                setFiltroCategoria('todas');
                setFiltroEstado('todos');
              }}
              className="text-xs mt-2 border-white/20"
            >
              Restablecer filtros
            </Button>
          </div>
        ) : (
          /* Tabla con contenido completo */
          <Table>
            <TableHeader className="bg-white/3 border-b border-white/8">
              <TableRow className="hover:bg-transparent border-white/8">
                <TableHead className="text-white/80 font-medium text-xs">
                  Servicio
                </TableHead>
                <TableHead className="text-white/80 font-medium text-xs">
                  Categoría
                </TableHead>
                <TableHead className="text-white/80 font-medium text-xs">
                  Precio
                </TableHead>
                <TableHead className="text-white/80 font-medium text-xs">
                  Duración
                </TableHead>
                <TableHead className="text-white/80 font-medium text-xs">
                  Ciclo Retorno
                </TableHead>
                <TableHead className="text-white/80 font-medium text-xs">
                  Insumos
                </TableHead>
                <TableHead className="text-white/80 font-medium text-xs">
                  Estado
                </TableHead>
                <TableHead className="text-right text-white/80 font-medium text-xs">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviciosFiltrados.map((servicio) => (
                <TableRow
                  key={servicio.id}
                  className="border-white/5 hover:bg-white/2 transition-colors"
                >
                  {/* Nombre y miniatura */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-[10px] bg-black/40 border border-white/10 flex items-center justify-center shrink-0 text-[var(--primary)]">
                        <Sparkles className="size-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-white leading-tight">
                          {servicio.nombre}
                        </p>
                        <p className="text-[11px] text-white/50">
                          ID: {servicio.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Categoría */}
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/10">
                      {servicio.categoria}
                    </span>
                  </TableCell>

                  {/* Precio */}
                  <TableCell className="text-white font-semibold text-sm tabular-nums">
                    <span className="text-[var(--primary)] font-bold">
                      ${servicio.precio.toFixed(2)}
                    </span>
                  </TableCell>

                  {/* Duración */}
                  <TableCell className="text-xs text-white/80">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3.5 text-white/50" />
                      <span className="tabular-nums">{servicio.duracionMin} min</span>
                    </div>
                  </TableCell>

                  {/* Ciclo de retorno */}
                  <TableCell className="text-xs text-white/80">
                    {servicio.cicloRetornoDias > 0 ? (
                      <span className="tabular-nums">{servicio.cicloRetornoDias} días</span>
                    ) : (
                      <span className="text-white/40 italic">Sin retoque</span>
                    )}
                  </TableCell>

                  {/* Insumos consumidos */}
                  <TableCell>
                    {servicio.consumos && servicio.consumos.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-white/80" title={servicio.consumos.map(c => `${c.insumoId}: ${c.cantidad}`).join(', ')}>
                        <Package className="size-3 text-[var(--accent)]" />
                        <span>{servicio.consumos.length} {servicio.consumos.length === 1 ? 'insumo' : 'insumos'}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-white/40 italic">Ninguno</span>
                    )}
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    {servicio.activo ? (
                      <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 text-[11px] font-medium">
                        Activo
                      </Badge>
                    ) : (
                      <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[11px] font-medium">
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditar(servicio)}
                        aria-label={`Editar ${servicio.nombre}`}
                        title={`Editar ${servicio.nombre}`}
                        className="h-11 w-11 rounded-[12px] p-0 text-white/80 hover:text-white hover:bg-white/10 md:h-10 md:w-10 2xl:w-auto 2xl:px-2.5"
                      >
                        <Pencil className="size-4 2xl:mr-1" aria-hidden="true" />
                        <span className="sr-only 2xl:not-sr-only">Editar</span>
                      </Button>

                      {servicio.activo ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSolicitarDesactivar(servicio)}
                          aria-label={`Desactivar ${servicio.nombre}`}
                          title={`Desactivar ${servicio.nombre}`}
                          className="h-11 w-11 rounded-[12px] p-0 text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/40 md:h-10 md:w-10 2xl:w-auto 2xl:px-2.5"
                        >
                          <PowerOff className="size-4 2xl:mr-1" aria-hidden="true" />
                          <span className="sr-only 2xl:not-sr-only">Desactivar</span>
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleReactivar(servicio)}
                          aria-label={`Activar ${servicio.nombre}`}
                          title={`Activar ${servicio.nombre}`}
                          className="h-11 w-11 rounded-[12px] p-0 text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950/40 md:h-10 md:w-10 2xl:w-auto 2xl:px-2.5"
                        >
                          <CheckCircle2 className="size-4 2xl:mr-1" aria-hidden="true" />
                          <span className="sr-only 2xl:not-sr-only">Activar</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Diálogo de Crear / Editar */}
      <ServicioFormDialog
        abierto={dialogoFormAbierto}
        onOpenChange={setDialogoFormAbierto}
        servicioAEditar={servicioEditando}
        insumosDisponibles={insumos}
      />

      {/* Diálogo de Confirmación de Desactivación */}
      <DesactivarConfirmDialog
        abierto={dialogoDesactivarAbierto}
        onOpenChange={setDialogoDesactivarAbierto}
        servicio={servicioADesactivar}
        onConfirmar={async (id) => {
          await alternarActivo(id, false);
        }}
      />
    </div>
  );
}
