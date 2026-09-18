import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { handleAuthError, requireRol } from '@/server/session';
import { calcularDashboard } from '@/domain/indicadores';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/dashboard (Exclusivo Admin)
 * Retorna las métricas consolidadas del panel de administración:
 * - Indicadores clave (citasHoy, ingresosMes, clientasActivas, tasaInasistencia).
 * - Agenda del día ordenada cronológicamente.
 * - Alertas críticas de insumos, citas por confirmar y retoques pendientes.
 * - Serie semanal de ingresos para gráficas (últimas 6 semanas).
 */
export async function GET(request?: NextRequest) {
  try {
    await requireRol('admin', request);

    // Parámetro opcional de fecha de referencia (útil para auditoría o pruebas del seed)
    let fechaReferencia: string | undefined;
    if (request?.url) {
      const url = new URL(request.url);
      fechaReferencia = url.searchParams.get('fecha') || undefined;
    }

    const citas = db.citas.list();
    const insumos = db.insumos.list();
    const usuarias = db.usuarias.list();

    const dashboardData = calcularDashboard(
      citas,
      insumos,
      usuarias,
      fechaReferencia
    );

    return NextResponse.json(dashboardData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
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
