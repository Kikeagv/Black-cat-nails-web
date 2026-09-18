import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import {
  clearSessionCookie,
  crearToken,
  handleAuthError,
  requireRol,
  sanitizarUsuaria,
  setSessionCookie,
} from '@/server/session';
import { Rol } from '@/types';

/**
 * Endpoint de prueba para verificar autorización por rol (BCN-07).
 *
 * - GET: Exige rol 'admin'. Devuelve 200 a admin, 403 a clienta, 401 sin sesión.
 * - POST: Permite iniciar sesión de prueba (admin o clienta) configurando la cookie httpOnly.
 * - DELETE: Elimina la cookie de sesión.
 */

export async function GET() {
  try {
    const admin = await requireRol('admin');

    return NextResponse.json({
      ok: true,
      mensaje: 'Acceso autorizado exclusivamente para rol admin',
      usuaria: admin,
    });
  } catch (error) {
    const errorResponse = handleAuthError(error);
    if (errorResponse) {
      return errorResponse;
    }

    return NextResponse.json(
      { error: { code: 'error_interno', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetRol: Rol = body.rol === 'clienta' ? 'clienta' : 'admin';
    const usuariaId: string =
      body.usuariaId || (targetRol === 'admin' ? 'usr_admin' : 'usr_1');

    const usuaria = db.usuarias.findById(usuariaId);
    if (!usuaria) {
      return NextResponse.json(
        { error: { code: 'usuaria_no_encontrada', message: 'Usuaria de prueba no encontrada' } },
        { status: 404 }
      );
    }

    const token = await crearToken(usuaria);
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      mensaje: `Sesión de prueba iniciada como ${usuaria.rol}`,
      token,
      usuaria: sanitizarUsuaria(usuaria),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'error_crear_sesion_prueba',
          message: error instanceof Error ? error.message : 'Error desconocido',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearSessionCookie();
    return NextResponse.json({
      ok: true,
      mensaje: 'Cookie de sesión eliminada correctamente',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'error_limpiar_sesion',
          message: error instanceof Error ? error.message : 'Error desconocido',
        },
      },
      { status: 500 }
    );
  }
}
