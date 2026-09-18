import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/server/session';

/**
 * POST /api/auth/logout (Autenticada)
 *
 * Cierra la sesión activa eliminando la cookie httpOnly bcn_session.
 */
export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({
      ok: true,
      mensaje: 'Sesión cerrada correctamente',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'error_servidor',
          message: error instanceof Error ? error.message : 'Error al cerrar sesión',
        },
      },
      { status: 500 }
    );
  }
}
