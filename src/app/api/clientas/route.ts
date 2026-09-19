import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { handleAuthError, requireRol } from '@/server/session';
import { Usuaria } from '@/types';
import { calcularMetricasClienta, ClientaConMetricas } from '@/domain/clientas';

/**
 * GET /api/clientas (Exclusivo Admin)
 * Retorna la lista de clientas con filtros (todas, activas, con_inasistencias) y métricas calculadas.
 */
export async function GET(request: NextRequest) {
  try {
    await requireRol('admin', request);

    const url = new URL(request.url);
    const busqueda = (url.searchParams.get('q') || '').trim().toLowerCase();
    const filtro = url.searchParams.get('filtro') || 'todas';

    const todasClientas: Usuaria[] = db.usuarias
      .list({ rol: 'clienta' })
      .map((u) => ({
        id: u.id,
        nombre: u.nombre,
        correo: u.correo,
        telefono: u.telefono,
        rol: u.rol,
        inasistencias: u.inasistencias,
        notasPrivadas: u.notasPrivadas,
        creadaEn: u.creadaEn,
      }));

    const todasCitas = db.citas.list();

    let resultado: ClientaConMetricas[] = todasClientas.map((clienta) => {
      const citasClienta = todasCitas.filter((c) => c.clientaId === clienta.id);
      const metricas = calcularMetricasClienta(clienta, citasClienta);
      return {
        ...clienta,
        metricas,
      };
    });

    // Filtro por texto de búsqueda
    if (busqueda) {
      resultado = resultado.filter(
        (c) =>
          c.nombre.toLowerCase().includes(busqueda) ||
          c.correo.toLowerCase().includes(busqueda) ||
          c.telefono.toLowerCase().includes(busqueda)
      );
    }

    // Filtro por categoría de estado
    if (filtro === 'activas') {
      resultado = resultado.filter((c) => c.metricas.esActiva);
    } else if (filtro === 'con_inasistencias') {
      resultado = resultado.filter((c) => c.metricas.inasistencias > 0);
    }

    // Ordenar alfabéticamente por nombre
    resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));

    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      {
        error: {
          code: 'error_servidor',
          message:
            error instanceof Error ? error.message : 'Error interno del servidor',
        },
      },
      { status: 500 }
    );
  }
}
