import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import {
  crearToken,
  formatZodError,
  sanitizarUsuaria,
  setSessionCookie,
  verifyPassword,
} from '@/server/session';
import { loginSchema } from '@/schemas';

/**
 * POST /api/auth/login (Público)
 *
 * Inicia sesión con correo y contraseña.
 * - Valida credenciales contra la base de datos y bcrypt.
 * - Si fallan las credenciales, devuelve mensaje genérico (400) sin revelar existencia del correo.
 * - Configura la cookie httpOnly bcn_session.
 * - Devuelve la entidad Usuaria sin passwordHash (200 OK).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          error: {
            code: 'cuerpo_invalido',
            message: 'El cuerpo de la petición debe ser un objeto JSON válido',
          },
        },
        { status: 400 }
      );
    }

    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(formatZodError(parseResult.error), { status: 400 });
    }

    const { correo, password } = parseResult.data;
    const usuaria = db.usuarias.findByCorreo(correo);

    if (!usuaria) {
      return NextResponse.json(
        {
          error: {
            code: 'credenciales_invalidas',
            message: 'Correo o contraseña incorrectos',
          },
        },
        { status: 400 }
      );
    }

    const passwordValida = await verifyPassword(password, usuaria.passwordHash);
    if (!passwordValida) {
      return NextResponse.json(
        {
          error: {
            code: 'credenciales_invalidas',
            message: 'Correo o contraseña incorrectos',
          },
        },
        { status: 400 }
      );
    }

    const token = await crearToken(usuaria);
    await setSessionCookie(token);

    return NextResponse.json(sanitizarUsuaria(usuaria), { status: 200 });
  } catch (error) {
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
