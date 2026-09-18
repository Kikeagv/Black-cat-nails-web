import { NextResponse } from 'next/server';
import { handleAuthError, requireSession } from '@/server/session';

/**
 * GET /api/auth/me (Autenticada)
 *
 * Retorna los datos de la usuaria autenticada actualmente.
 * Devuelve 401 si no hay sesión activa.
 * Nunca expone passwordHash.
 */
export async function GET() {
  try {
    const usuaria = await requireSession();
    return NextResponse.json(usuaria, { status: 200 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      {
        error: {
          code: 'error_servidor',
          message: error instanceof Error ? error.message : 'Error interno del servidor',
        },
      },
      { status: 500 }
    );
  }
}
