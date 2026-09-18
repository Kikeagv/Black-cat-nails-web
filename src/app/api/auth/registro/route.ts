import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import {
  crearToken,
  formatZodError,
  hashPassword,
  sanitizarUsuaria,
  setSessionCookie,
} from '@/server/session';
import { registroSchema } from '@/schemas';

/**
 * POST /api/auth/registro (Público)
 *
 * Registra una nueva usuaria con rol 'clienta' y abre su sesión.
 * - Valida el cuerpo con registroSchema (Zod).
 * - Rechaza correo duplicado con 400 y código 'correo_duplicado'.
 * - Hashea la contraseña con 10 rondas de bcrypt.
 * - Asigna rol clienta, 0 inasistencias y genera cookie httpOnly.
 * - Devuelve la usuaria creada sin passwordHash (201 Created).
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

    const parseResult = registroSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(formatZodError(parseResult.error), { status: 400 });
    }

    const { nombre, correo, telefono, password } = parseResult.data;
    const correoNormalizado = correo.trim().toLowerCase();

    const usuariaExistente = db.usuarias.findByCorreo(correoNormalizado);
    if (usuariaExistente) {
      return NextResponse.json(
        {
          error: {
            code: 'correo_duplicado',
            message: 'Ese correo ya está registrado',
          },
        },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const nuevaUsuaria = db.usuarias.create({
      nombre,
      correo: correoNormalizado,
      telefono,
      rol: 'clienta',
      inasistencias: 0,
      passwordHash,
    });

    const token = await crearToken(nuevaUsuaria);
    await setSessionCookie(token);

    return NextResponse.json(sanitizarUsuaria(nuevaUsuaria), { status: 201 });
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
