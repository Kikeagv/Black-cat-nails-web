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
  Search,
  RefreshCw,
  AlertCircle,
  Clock,
  Layers,
  Package,
} from 'lucide-react';
import { useCatalogo } from '@/context/CatalogoContext';
import { Insumo, Servicio } from '@/types';
import { insumosService } from '@/services/insumosService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

// Insumos base como fallback defensivo si la API aún no los sirve
const INSUMOS_FALLBACK: Insumo[] = [
  { id: 'ins_1', nombre: 'Acrílico en polvo', unidad: 'g', existencia: 450, minimo: 200, costo: 0.08 },
  { id: 'ins_2', nombre: 'Removedor de uñas', unidad: 'ml', existencia: 40, minimo: 100, costo: 0.05 },
  { id: 'ins_3', nombre: 'Tips para uñas', unidad: 'unidad', existencia: 180, minimo: 100, costo: 0.1 },
  { id: 'ins_4', nombre: 'Gel constructor', unidad: 'g', existencia: 250, minimo: 100, costo: 0.15 },
  { id: 'ins_5', nombre: 'Esmalte semipermanente', unidad: 'ml', existencia: 120, minimo: 100, costo: 0.2 },
];

export default function AdminServiciosPage() {
  const { servicios, cargando, error, alternarActivo, cargarServicios } = useCatalogo();

  // Estados locales para insumos disponibles
  const [insumos, setInsumos] = useState<Insumo[]>(INSUMOS_FALLBACK);

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
    async function cargarInsumos() {
      try {
        const datos = await insumosService.listar();
        if (Array.isArray(datos) && datos.length > 0) {
          setInsumos(datos);
        }
      } catch {
        // Mantiene INSUMOS_FALLBACK silenciosamente si la API de insumos aún no está activa
      }
    }
    cargarInsumos();
  }, []);

  // Métricas rápidas
  const metricas = useMemo(() => {
    const total = servicios.length;
    const activos = servicios.filter((s) => s.activo).length;
    const inactivos = total - activos;
    const duracionPromedio =
      total > 0
        ? Math.round(
            servicios.reduce((acc, s) => acc + s.duracionMin, 0) / total
          )
        : 0;
    return { total, activos, inactivos, duracionPromedio };
  }, [servicios]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[var(--primary)]">
            <Sparkles className="size-6" />
            <h1 className="text-display-32 font-serif text-white">
              Catálogo de Servicios
            </h1>
          </div>
          <p className="text-sm text-[var(--accent)]">
            Administrá los precios, duraciones, ciclo de retorno e insumos consumidos por sesión.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => cargarServicios()}
            disabled={cargando}
            className="text-xs gap-1.5 border-white/15 hover:bg-white/10"
          >
            <RefreshCw className={`size-3.5 ${cargando ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </Button>
          <Button
            size="sm"
            onClick={handleCrearNuevo}
            className="text-xs gap-1.5 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 shadow-md"
          >
            <Plus className="size-4" />
            <span>Nuevo servicio</span>
          </Button>
        </div>
      </div>

      {/* 2. Tarjetas de métricas rápidas (Estilo Figura 6) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 rounded-[16px] border border-white/10 bg-card/60 backdrop-blur space-y-1">
          <div className="flex items-center justify-between text-white/60 text-xs">
            <span>Total Servicios</span>
            <Layers className="size-4 text-[var(--accent)]" />
          </div>
          <p className="text-2xl font-bold text-white">{metricas.total}</p>
          <p className="text-[11px] text-white/50">Servicios en el sistema</p>
        </Card>

        <Card className="p-4 rounded-[16px] border border-white/10 bg-card/60 backdrop-blur space-y-1">
          <div className="flex items-center justify-between text-white/60 text-xs">
            <span>Activos en Web</span>
            <CheckCircle2 className="size-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{metricas.activos}</p>
          <p className="text-[11px] text-white/50">Visibles para agendar</p>
        </Card>

        <Card className="p-4 rounded-[16px] border border-white/10 bg-card/60 backdrop-blur space-y-1">
          <div className="flex items-center justify-between text-white/60 text-xs">
            <span>Inactivos</span>
            <PowerOff className="size-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-300">{metricas.inactivos}</p>
          <p className="text-[11px] text-white/50">Historial preservado</p>
        </Card>

        <Card className="p-4 rounded-[16px] border border-white/10 bg-card/60 backdrop-blur space-y-1">
          <div className="flex items-center justify-between text-white/60 text-xs">
            <span>Duración Media</span>
            <Clock className="size-4 text-[var(--primary)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--primary)]">
            {metricas.duracionPromedio} <span className="text-sm font-normal text-white/70">min</span>
          </p>
          <p className="text-[11px] text-white/50">Tiempo estándar por cita</p>
        </Card>
      </div>

      {/* 3. Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card/40 p-3 rounded-[16px] border border-white/10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-white/40" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o categoría..."
            className="pl-9 bg-black/20 border-white/10 text-sm h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro categoría */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="h-9 rounded-md border border-white/15 bg-black/40 px-3 text-xs text-white focus:outline-none"
          >
            {categoriasDisponibles.map((cat) => (
              <option key={cat} value={cat} className="bg-[#1E1610] text-white capitalize">
                {cat === 'todas' ? 'Todas las categorías' : cat}
              </option>
            ))}
          </select>

          {/* Filtro estado */}
          <select
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(e.target.value as 'todos' | 'activos' | 'inactivos')
            }
            className="h-9 rounded-md border border-white/15 bg-black/40 px-3 text-xs text-white focus:outline-none"
          >
            <option value="todos" className="bg-[#1E1610] text-white">
              Todos los estados
            </option>
            <option value="activos" className="bg-[#1E1610] text-white">
              Solo activos
            </option>
            <option value="inactivos" className="bg-[#1E1610] text-white">
              Solo inactivos
            </option>
          </select>
        </div>
      </div>

      {/* 4. Estado de error con reintento */}
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

      {/* 5. Tabla de servicios y estados */}
      <Card className="rounded-[16px] border border-white/10 bg-card/60 backdrop-blur overflow-hidden">
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
            <TableHeader className="bg-black/30">
              <TableRow className="border-white/10 hover:bg-transparent text-white/70 text-xs">
                <TableHead className="w-[280px]">Servicio</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Ciclo Retorno</TableHead>
                <TableHead>Insumos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviciosFiltrados.map((servicio) => (
                <TableRow
                  key={servicio.id}
                  className="border-white/10 hover:bg-white/5 transition-colors"
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
                  <TableCell className="text-white font-semibold text-sm">
                    <span className="text-[var(--primary)] font-bold">
                      ${servicio.precio.toFixed(2)}
                    </span>
                  </TableCell>

                  {/* Duración */}
                  <TableCell className="text-xs text-white/80">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3.5 text-white/50" />
                      <span>{servicio.duracionMin} min</span>
                    </div>
                  </TableCell>

                  {/* Ciclo de retorno */}
                  <TableCell className="text-xs text-white/80">
                    {servicio.cicloRetornoDias > 0 ? (
                      <span>{servicio.cicloRetornoDias} días</span>
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
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditar(servicio)}
                        className="h-8 px-2.5 text-xs text-white/80 hover:text-white hover:bg-white/10"
                      >
                        <Pencil className="size-3.5 mr-1" />
                        Editar
                      </Button>

                      {servicio.activo ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSolicitarDesactivar(servicio)}
                          className="h-8 px-2.5 text-xs text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/40"
                        >
                          <PowerOff className="size-3.5 mr-1" />
                          Desactivar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReactivar(servicio)}
                          className="h-8 px-2.5 text-xs text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950/40"
                        >
                          <CheckCircle2 className="size-3.5 mr-1" />
                          Activar
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
