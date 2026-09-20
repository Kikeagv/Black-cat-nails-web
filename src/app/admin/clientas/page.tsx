'use client';

/**
 * GESTIÓN DE CLIENTAS — BLACK CAT NAILS WEB (RF-07 / BCN-29)
 *
 * Módulo administrativo para directorio y fichas de clientas:
 * - Listado completo con búsqueda (nombre, correo, teléfono).
 * - Filtros rápidos: todas, activas (últimos 60 días) y con inasistencias.
 * - Marca visible y destacada para clientas con 2 o más inasistencias acumuladas.
 * - Ficha modal individual con historial cronológico, servicios frecuentes,
 *   total gastado y notas privadas editables por la admin.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Users,
  RefreshCw,
  AlertTriangle,
  Eye,
  Mail,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { clientasService } from '@/services/clientasService';
import { ClientaConMetricas } from '@/domain/clientas';
import { FichaClientaDialog } from '@/components/admin/clientas';

export default function AdminClientasPage() {
  const [clientas, setClientas] = useState<ClientaConMetricas[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<
    'todas' | 'activas' | 'con_inasistencias'
  >('todas');

  // Modal de ficha
  const [dialogoFichaAbierto, setDialogoFichaAbierto] = useState(false);
  const [clientaSeleccionadaId, setClientaSeleccionadaId] = useState<
    string | null
  >(null);

  const refrescar = useCallback(() => {
    setCargando(true);
    clientasService
      .listar({
        q: busqueda,
        filtro: filtroEstado,
      })
      .then((data) => {
        setClientas(data);
        setError(null);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Error al cargar el directorio de clientas.'
        );
      })
      .finally(() => {
        setCargando(false);
      });
  }, [busqueda, filtroEstado]);

  useEffect(() => {
    let activo = true;

    clientasService
      .listar({
        q: busqueda,
        filtro: filtroEstado,
      })
      .then((data) => {
        if (activo) {
          setClientas(data);
          setError(null);
          setCargando(false);
        }
      })
      .catch((err) => {
        if (activo) {
          setError(
            err instanceof Error
              ? err.message
              : 'Error al cargar el directorio de clientas.'
          );
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [busqueda, filtroEstado]);

  const handleAbrirFicha = (id: string) => {
    setClientaSeleccionadaId(id);
    setDialogoFichaAbierto(true);
  };

  return (
    <div className="space-y-6 max-w-6xl pb-10">
      {/* 1. Encabezado principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-display-32 font-serif text-white">
          Gestión de Clientas
        </h1>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refrescar()}
          disabled={cargando}
          className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white"
        >
          <RefreshCw
            className={`size-4 mr-1.5 ${cargando ? 'animate-spin text-[var(--primary)]' : ''}`}
          />
          Actualizar
        </Button>
      </div>

      {/* 2. Barra de búsqueda y filtros tipo píldora */}
      <Card className="p-4 rounded-[16px] border border-white/8 bg-card/60 backdrop-blur space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Input de búsqueda */}
          <SearchInput
            containerClassName="flex-1 max-w-md"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar clienta por nombre, correo o teléfono..."
          />

          {/* Filtros tipo píldora */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-white/50 mr-1 shrink-0">Filtrar:</span>
            <Button
              variant={filtroEstado === 'todas' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroEstado('todas')}
              className={`text-xs h-8 rounded-full ${
                filtroEstado === 'todas'
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'border-white/10 text-white/60 hover:bg-white/5'
              }`}
            >
              Todas
            </Button>
            <Button
              variant={filtroEstado === 'activas' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroEstado('activas')}
              className={`text-xs h-8 rounded-full ${
                filtroEstado === 'activas'
                  ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/40'
                  : 'border-white/10 text-emerald-300/70 hover:bg-emerald-500/10'
              }`}
            >
              Activas (60d)
            </Button>
            <Button
              variant={filtroEstado === 'con_inasistencias' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroEstado('con_inasistencias')}
              className={`text-xs h-8 rounded-full ${
                filtroEstado === 'con_inasistencias'
                  ? 'bg-red-500/30 text-red-300 border-red-500/40 hover:bg-red-500/40'
                  : 'border-white/10 text-red-300/70 hover:bg-red-500/10'
              }`}
            >
              Con inasistencias
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Estado de error */}
      {error && (
        <Card className="p-6 rounded-[16px] border border-red-500/30 bg-red-500/10 space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-medium">
            <AlertCircle className="size-5" />
            <span>Error al cargar las clientas</span>
          </div>
          <p className="text-sm text-white/70">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refrescar()}
            className="border-red-500/40 text-red-300 hover:bg-red-500/20"
          >
            <RefreshCw className="size-4 mr-1.5" />
            Reintentar
          </Button>
        </Card>
      )}

      {/* 4. Tabla de clientas */}
      <Card className="rounded-[16px] border border-white/8 bg-card/60 backdrop-blur overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/3 border-b border-white/8">
              <TableRow className="hover:bg-transparent border-white/8">
                <TableHead className="text-white/80 font-medium text-xs">
                  Clienta
                </TableHead>
                <TableHead className="text-white/80 font-medium text-xs">
                  Contacto
                </TableHead>
                <TableHead className="text-white/80 font-medium text-xs">
                  Citas completadas
                </TableHead>
                <TableHead className="text-white/80 font-medium text-xs">
                  Total gastado
                </TableHead>
                <TableHead className="text-white/80 font-medium text-xs">
                  Inasistencias
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
                        <div className="h-4 w-36 bg-white/10 rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-28 bg-white/10 rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-16 bg-white/10 rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-16 bg-white/10 rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 bg-white/10 rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 w-16 bg-white/10 rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-8 w-20 bg-white/10 rounded ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}

              {/* Lista vacía */}
              {!cargando && clientas.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-48 text-center text-white/60 space-y-2"
                  >
                    <Users className="size-8 mx-auto text-white/20" />
                    <p className="font-medium text-white/80">
                      No se encontraron clientas
                    </p>
                    <p className="text-xs text-white/40 max-w-sm mx-auto">
                      {busqueda || filtroEstado !== 'todas'
                        ? 'No hay clientas que coincidan con los criterios de búsqueda seleccionados.'
                        : 'No hay clientas registradas en el sistema aún.'}
                    </p>
                    {(busqueda || filtroEstado !== 'todas') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBusqueda('');
                          setFiltroEstado('todas');
                        }}
                        className="border-white/10 text-white/80 hover:bg-white/5"
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}

              {/* Filas de clientas */}
              {!cargando &&
                clientas.map((clienta) => {
                  return (
                    <TableRow
                      key={clienta.id}
                      className="border-white/5 hover:bg-white/2 transition-colors"
                    >
                      {/* Nombre y avatar */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-[var(--surface)] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {clienta.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">
                              {clienta.nombre}
                            </div>
                            <span className="text-[11px] text-white/40">
                              Desde{' '}
                              {new Date(clienta.creadaEn).toLocaleDateString(
                                'es-SV',
                                { month: 'short', year: 'numeric' }
                              )}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Contacto */}
                      <TableCell>
                        <div className="space-y-0.5 text-xs text-white/80">
                          <div className="flex items-center gap-1.5 text-white/90">
                            <Mail className="size-3 text-white/40" />
                            <span>{clienta.correo}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/60">
                            <Phone className="size-3 text-white/40" />
                            <span>{clienta.telefono}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Citas completadas / total */}
                      <TableCell className="text-sm font-medium text-white whitespace-nowrap">
                        {clienta.metricas.completadas}{' '}
                        <span className="text-xs text-white/40 font-normal">
                          / {clienta.metricas.totalCitas} citas
                        </span>
                      </TableCell>

                      {/* Total gastado */}
                      <TableCell className="text-sm font-bold text-emerald-400 whitespace-nowrap">
                        ${clienta.metricas.totalGastado.toFixed(2)}
                      </TableCell>

                      {/* Inasistencias con marca visible si >= 2 */}
                      <TableCell className="whitespace-nowrap">
                        {clienta.metricas.alertaInasistencias ? (
                          <Badge className="bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-semibold gap-1">
                            <AlertTriangle className="size-3 text-red-400" />
                            {clienta.metricas.inasistencias} inasistencias (Riesgo)
                          </Badge>
                        ) : clienta.metricas.inasistencias > 0 ? (
                          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs gap-1">
                            {clienta.metricas.inasistencias} inasistencia
                          </Badge>
                        ) : (
                          <span className="text-xs text-white/40">0</span>
                        )}
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        {clienta.metricas.esActiva ? (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
                            Activa
                          </Badge>
                        ) : (
                          <Badge className="bg-white/10 text-white/50 border border-white/10 text-xs">
                            Inactiva
                          </Badge>
                        )}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAbrirFicha(clienta.id)}
                          className="h-8 px-2.5 border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 text-xs"
                        >
                          <Eye className="size-3.5 mr-1" />
                          Ver ficha
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal Ficha de Clienta */}
      <FichaClientaDialog
        abierto={dialogoFichaAbierto}
        onOpenChange={setDialogoFichaAbierto}
        clientaId={clientaSeleccionadaId}
        onClientaActualizada={() => refrescar()}
      />
    </div>
  );
}
