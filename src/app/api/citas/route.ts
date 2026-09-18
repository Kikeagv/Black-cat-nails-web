import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { handleAuthError, requireSession } from '@/server/session';
import { EstadoCita } from '@/types';

/**
 * GET /api/citas (Autenticada)
 *
 * Listado de citas según rol:
 * - Clienta: recibe únicamente sus propias citas (clientaId forzado a su usuaria.id).
 * - Admin: recibe todas las citas (o filtra por clientaId si se incluye en query).
 * - Filtros opcionales: desde, hasta, estado.
 */
export async function GET(request: NextRequest) {
  try {
    const usuaria = await requireSession();
    const url = new URL(request.url);

    const desde = url.searchParams.get('desde') || undefined;
    const hasta = url.searchParams.get('hasta') || undefined;
    const estadoParam = url.searchParams.get('estado');
    const estado = estadoParam ? (estadoParam as EstadoCita) : undefined;

    const clientaId =
      usuaria.rol === 'admin'
        ? url.searchParams.get('clientaId') || undefined
        : usuaria.id;

    const citas = db.citas.list({
      clientaId,
      desde,
      hasta,
      estado,
    });

    return NextResponse.json(citas, { status: 200 });
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
