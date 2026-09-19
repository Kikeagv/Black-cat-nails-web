'use client';

/**
 * ADMINISTRACIÓN DE INVENTARIO E INSUMOS — BLACK CAT NAILS WEB (RF-06 / BCN-28)
 *
 * Módulo administrativo de inventario con diseño inspirado en la Figura 6:
 * - Tabla completa: insumo, existencia, mínimo, progreso vs mínimo, rendimiento en clientas y estado.
 * - Tarjetas de métricas rápidas (total insumos, críticos, bajo stock, óptimos y valoración económica).
 * - Barra de progreso visual contra el nivel mínimo con código de color.
 * - Cálculo de rendimiento en clientas atendibles según consumos de servicios activos.
 * - Diálogos para crear, editar insumos y registrar compras sumando stock.
 * - Búsqueda en vivo y filtros por nivel de criticidad.
 * - Estados de carga (esqueletos), lista vacía y error con reintento.
 */

import React, { useMemo, useState } from 'react';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Pencil,
  ShoppingBag,
  Search,
  RefreshCw,
  DollarSign,
  Users,
} from 'lucide-react';
import { useInventario } from '@/context/InventarioContext';
import { useCatalogo } from '@/context/CatalogoContext';
import { EstadoInsumo, Insumo } from '@/types';
import { calcularRendimientoClientas } from '@/domain/inventario';
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
import {
  BarraProgresoMinimo,
  InsumoFormDialog,
  RegistrarCompraDialog,
} from '@/components/admin/inventario';

export default function AdminInventarioPage() {
  const { insumos, cargando, error, cargarInsumos } = useInventario();
  const { servicios } = useCatalogo();

  // Estados para modales
  const [dialogoFormAbierto, setDialogoFormAbierto] = useState(false);
  const [insumoAEditar, setInsumoAEditar] = useState<Insumo | null>(null);

  const [dialogoCompraAbierto, setDialogoCompraAbierto] = useState(false);
  const [insumoParaCompra, setInsumoParaCompra] = useState<Insumo | null>(null);

  // Filtros de tabla
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoInsumo>('todos');

  // Métricas rápidas de cabecera
  const metricas = useMemo(() => {
    const total = insumos.length;
    const criticos = insumos.filter((i) => i.estado === 'critico').length;
    const bajos = insumos.filter((i) => i.estado === 'bajo').length;
    const optimos = insumos.filter((i) => i.estado === 'ok').length;
    const valorTotalUSD = insumos.reduce(
      (acc, i) => acc + (i.existencia || 0) * (i.costo || 0),
      0
    );

    return {
      total,
      criticos,
      bajos,
      optimos,
      valorTotalUSD: Number(valorTotalUSD.toFixed(2)),
    };
  }, [insumos]);

  // Filtrado de insumos
  const insumosFiltrados = useMemo(() => {
    return insumos.filter((item) => {
      const coincideBusqueda =
        busqueda.trim() === '' ||
        item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.unidad.toLowerCase().includes(busqueda.toLowerCase());

      const coincideEstado =
        filtroEstado === 'todos' || item.estado === filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [insumos, busqueda, filtroEstado]);

  const handleAbrirCrear = () => {
    setInsumoAEditar(null);
    setDialogoFormAbierto(true);
  };

  const handleAbrirEditar = (insumo: Insumo) => {
    setInsumoAEditar(insumo);
    setDialogoFormAbierto(true);
  };

  const handleAbrirCompra = (insumo: Insumo) => {
    setInsumoParaCompra(insumo);
    setDialogoCompraAbierto(true);
  };

  return (
    <div className="space-y-6 max-w-6xl pb-10">
      {/* 1. Encabezado principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-display-32 font-serif text-white">
              Inventario e Insumos
            </h1>
            <Badge
              variant="outline"
              className="border-white/10 text-[var(--accent)] text-xs font-mono"
            >
              RF-06
            </Badge>
          </div>
          <p className="text-sm text-[var(--accent)]">
            Control de existencias, mínimos de seguridad, rendimiento y compras de insumos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => cargarInsumos()}
            disabled={cargando}
            className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white"
            title="Recargar inventario"
          >
            <RefreshCw
              className={`size-4 mr-1.5 ${cargando ? 'animate-spin text-[var(--primary)]' : ''}`}
            />
            Actualizar
          </Button>

          <Button
            onClick={handleAbrirCrear}
            className="bg-[var(--primary)] text-[#1A1209] font-medium hover:bg-[var(--primary)]/90 shadow-md"
          >
            <Plus className="size-4 mr-1.5" />
            Nuevo insumo
          </Button>
        </div>
      </div>

      {/* 2. Tarjetas de métricas rápidas (Estilo Figura 6) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Insumos */}
        <Card className="p-4 rounded-[16px] border border-white/8 bg-card/60 backdrop-blur space-y-2">
          <div className="flex items-center justify-between text-white/60">
            <span className="text-xs font-medium">Total Insumos</span>
            <Package className="size-4 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-bold text-white">
            {cargando ? '—' : metricas.total}
          </div>
          <p className="text-[11px] text-white/40">Materias primas registradas</p>
        </Card>

        {/* Críticos */}
        <Card className="p-4 rounded-[16px] border border-red-500/20 bg-red-500/5 backdrop-blur space-y-2">
          <div className="flex items-center justify-between text-red-300">
            <span className="text-xs font-medium">Bajo Mínimo</span>
            <AlertCircle className="size-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">
            {cargando ? '—' : metricas.criticos}
          </div>
          <p className="text-[11px] text-red-300/70">Requieren compra urgente</p>
        </Card>

        {/* Próximo a agotarse / Bajo */}
        <Card className="p-4 rounded-[16px] border border-amber-500/20 bg-amber-500/5 backdrop-blur space-y-2">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-medium">Bajo Stock</span>
            <AlertTriangle className="size-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {cargando ? '—' : metricas.bajos}
          </div>
          <p className="text-[11px] text-amber-300/70">Entre 100% y 150% del mín.</p>
        </Card>

        {/* Óptimos */}
        <Card className="p-4 rounded-[16px] border border-emerald-500/20 bg-emerald-500/5 backdrop-blur space-y-2">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-xs font-medium">Stock Óptimo</span>
            <CheckCircle2 className="size-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {cargando ? '—' : metricas.optimos}
          </div>
          <p className="text-[11px] text-emerald-300/70">Por encima de seguridad</p>
        </Card>

        {/* Valor Total Inventario */}
        <Card className="p-4 rounded-[16px] border border-white/8 bg-card/60 backdrop-blur space-y-2 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-white/60">
            <span className="text-xs font-medium">Valor Total</span>
            <DollarSign className="size-4 text-[var(--primary)]" />
          </div>
          <div className="text-2xl font-bold text-white">
            {cargando ? '—' : `$${metricas.valorTotalUSD.toFixed(2)}`}
          </div>
          <p className="text-[11px] text-white/40">Existencias × costo</p>
        </Card>
      </div>

      {/* 3. Filtros y Búsqueda */}
      <Card className="p-4 rounded-[16px] border border-white/8 bg-card/60 backdrop-blur space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Campo de búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-white/40" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o unidad de medida..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[var(--primary)] text-sm"
            />
          </div>

          {/* Filtro por estado del semáforo */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-white/50 mr-1 shrink-0">Filtrar:</span>
            <Button
              variant={filtroEstado === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroEstado('todos')}
              className={`text-xs h-8 rounded-full ${
                filtroEstado === 'todos'
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'border-white/10 text-white/60 hover:bg-white/5'
              }`}
            >
              Todos ({insumos.length})
            </Button>
            <Button
              variant={filtroEstado === 'critico' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroEstado('critico')}
              className={`text-xs h-8 rounded-full ${
                filtroEstado === 'critico'
                  ? 'bg-red-500/30 text-red-300 border-red-500/40 hover:bg-red-500/40'
                  : 'border-white/10 text-red-300/70 hover:bg-red-500/10'
              }`}
            >
              Críticos ({metricas.criticos})
            </Button>
            <Button
              variant={filtroEstado === 'bajo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroEstado('bajo')}
              className={`text-xs h-8 rounded-full ${
                filtroEstado === 'bajo'
                  ? 'bg-amber-500/30 text-amber-300 border-amber-500/40 hover:bg-amber-500/40'
                  : 'border-white/10 text-amber-300/70 hover:bg-amber-500/10'
              }`}
            >
              Bajo stock ({metricas.bajos})
            </Button>
            <Button
              variant={filtroEstado === 'ok' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroEstado('ok')}
              className={`text-xs h-8 rounded-full ${
                filtroEstado === 'ok'
                  ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/40'
                  : 'border-white/10 text-emerald-300/70 hover:bg-emerald-500/10'
              }`}
            >
              Óptimos ({metricas.optimos})
            </Button>
          </div>
        </div>
      </Card>

      {/* 4. Estado de error con botón de reintentar */}
      {error && (
        <Card className="p-6 rounded-[16px] border border-red-500/30 bg-red-500/10 space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-medium">
            <AlertCircle className="size-5" />
            <span>Error al cargar el inventario de insumos</span>
          </div>
          <p className="text-sm text-white/70">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => cargarInsumos()}
            className="border-red-500/40 text-red-300 hover:bg-red-500/20"
          >
            <RefreshCw className="size-4 mr-1.5" />
            Reintentar
          </Button>
        </Card>
      )}

      {/* 5. Tabla principal de insumos */}
      <Card className="rounded-[16px] border border-white/8 bg-card/60 backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/3 border-b border-white/8">
              <TableRow className="hover:bg-transparent border-white/8">
                <TableHead className="text-white/80 font-medium text-xs">
                  Insumo
                </TableHead>
                <TableHead className="text-white/80 font-medium text-xs">
                  Existencia
                </TableHead>
                <TableHead className="text-white/80 font-medium text-xs">
                  Mínimo
                </TableHead>
                <TableHead className="text-white/80 font-medium text-xs min-w-[170px]">
                  Progreso vs Mínimo
                </TableHead>
                <TableHead className="text-white/80 font-medium text-xs min-w-[150px]">
                  Rendimiento (Clientas)
                </TableHead>
                <TableHead className="text-white/80 font-medium text-xs">
                  Costo unitario
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
              {/* Esqueletos de carga */}
              {cargando && (
                <>
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <TableRow key={idx} className="border-white/5 animate-pulse">
                      <TableCell>
                        <div className="h-4 w-32 bg-white/10 rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-16 bg-white/10 rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-16 bg-white/10 rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-3 w-32 bg-white/10 rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-24 bg-white/10 rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-14 bg-white/10 rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 w-20 bg-white/10 rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-8 w-24 bg-white/10 rounded ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}

              {/* Lista vacía */}
              {!cargando && insumosFiltrados.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-48 text-center text-white/60 space-y-2"
                  >
                    <Package className="size-8 mx-auto text-white/20" />
                    <p className="font-medium text-white/80">
                      No se encontraron insumos
                    </p>
                    <p className="text-xs text-white/40 max-w-sm mx-auto">
                      {busqueda || filtroEstado !== 'todos'
                        ? 'No hay registros que coincidan con los filtros aplicados.'
                        : 'El inventario no tiene insumos registrados aún.'}
                    </p>
                    {busqueda || filtroEstado !== 'todos' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBusqueda('');
                          setFiltroEstado('todos');
                        }}
                        className="border-white/10 text-white/80 hover:bg-white/5"
                      >
                        Limpiar filtros
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleAbrirCrear}
                        className="bg-[var(--primary)] text-[#1A1209] font-medium"
                      >
                        <Plus className="size-3.5 mr-1" />
                        Crear primer insumo
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}

              {/* Filas de insumos */}
              {!cargando &&
                insumosFiltrados.map((insumo) => {
                  const rendimiento = calcularRendimientoClientas(
                    insumo,
                    servicios
                  );

                  return (
                    <TableRow
                      key={insumo.id}
                      className="border-white/5 hover:bg-white/2 transition-colors"
                    >
                      {/* Nombre e indicador de unidad */}
                      <TableCell>
                        <div className="font-medium text-white text-sm">
                          {insumo.nombre}
                        </div>
                        <span className="text-[11px] text-white/40">
                          Medido en {insumo.unidad}
                        </span>
                      </TableCell>

                      {/* Existencia */}
                      <TableCell className="font-medium text-white text-sm whitespace-nowrap">
                        {insumo.existencia}{' '}
                        <span className="text-xs text-white/40">
                          {insumo.unidad}
                        </span>
                      </TableCell>

                      {/* Mínimo */}
                      <TableCell className="text-white/70 text-sm whitespace-nowrap">
                        {insumo.minimo}{' '}
                        <span className="text-xs text-white/40">
                          {insumo.unidad}
                        </span>
                      </TableCell>

                      {/* Barra de progreso contra el mínimo (Figura 6) */}
                      <TableCell>
                        <BarraProgresoMinimo
                          existencia={insumo.existencia}
                          minimo={insumo.minimo}
                          unidad={insumo.unidad}
                          estado={insumo.estado}
                        />
                      </TableCell>

                      {/* Rendimiento en clientas atendibles */}
                      <TableCell>
                        {rendimiento ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-sm font-semibold text-white">
                              <Users className="size-3.5 text-[var(--accent)]" />
                              <span>
                                ≈ {rendimiento.clientasAtendibles} clientas
                              </span>
                            </div>
                            <p
                              className="text-[10px] text-white/40 truncate max-w-[180px]"
                              title={rendimiento.serviciosAsociados.join(', ')}
                            >
                              {rendimiento.serviciosAsociados.length} servicio(s) (
                              {rendimiento.consumoPromedio} {insumo.unidad}/cita)
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-white/30 italic">
                            Sin servicios vinculados
                          </span>
                        )}
                      </TableCell>

                      {/* Costo unitario */}
                      <TableCell className="text-sm text-white/80 whitespace-nowrap">
                        ${insumo.costo.toFixed(2)}{' '}
                        <span className="text-[11px] text-white/40">
                          / {insumo.unidad}
                        </span>
                      </TableCell>

                      {/* Estado semáforo */}
                      <TableCell>
                        {insumo.estado === 'critico' && (
                          <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs gap-1">
                            <AlertCircle className="size-3" />
                            Crítico
                          </Badge>
                        )}
                        {insumo.estado === 'bajo' && (
                          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs gap-1">
                            <AlertTriangle className="size-3" />
                            Bajo stock
                          </Badge>
                        )}
                        {insumo.estado === 'ok' && (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs gap-1">
                            <CheckCircle2 className="size-3" />
                            Óptimo
                          </Badge>
                        )}
                      </TableCell>

                      {/* Botones de acción */}
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Registrar compra (suma existencia) */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAbrirCompra(insumo)}
                            className="h-8 px-2.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 text-xs"
                            title="Registrar compra (sumar existencia)"
                          >
                            <ShoppingBag className="size-3.5 mr-1" />
                            Comprar
                          </Button>

                          {/* Editar insumo */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAbrirEditar(insumo)}
                            className="h-8 px-2 text-white/60 hover:text-white hover:bg-white/5"
                            title="Editar datos del insumo"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Diálogos modales */}
      <InsumoFormDialog
        abierto={dialogoFormAbierto}
        onOpenChange={setDialogoFormAbierto}
        insumoAEditar={insumoAEditar}
      />

      <RegistrarCompraDialog
        abierto={dialogoCompraAbierto}
        onOpenChange={setDialogoCompraAbierto}
        insumo={insumoParaCompra}
      />
    </div>
  );
}
