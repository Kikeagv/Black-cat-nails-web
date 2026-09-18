import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { handleAuthError, requireRol } from '@/server/session';

/**
 * GET /api/insumos (Exclusivo Admin)
 * Retorna la lista de insumos de inventario en el sistema.
 */
export async function GET() {
  try {
    await requireRol('admin');
    const insumos = db.insumos.list();
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
