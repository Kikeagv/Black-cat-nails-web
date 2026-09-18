import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { handleAuthError, requireRol } from '@/server/session';
import { calcularEstado } from '@/domain/inventario';

/**
 * GET /api/insumos (Exclusivo Admin)
 * Retorna la lista de insumos de inventario en el sistema con estado calculado (RN-04).
 */
export async function GET(request?: NextRequest) {
  try {
    await requireRol('admin', request);
    const insumos = db.insumos.list().map((insumo) => ({
      ...insumo,
      estado: calcularEstado(insumo),
    }));
    return NextResponse.json(insumos, { status: 200 });
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
