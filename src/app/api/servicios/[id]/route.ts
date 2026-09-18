import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import {
  formatZodError,
  handleAuthError,
  requireRol,
  requireSession,
} from '@/server/session';
import { actualizarServicioSchema } from '@/schemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/servicios/[id] (Autenticada)
 *
 * Consulta individual de servicio:
 * - Clienta: solo puede ver el servicio si está activo (activo: true).
 * - Admin: puede consultar cualquier servicio.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const usuaria = await requireSession();
    const { id } = await context.params;

    const servicio = db.servicios.findById(id);
    if (!servicio) {
      return NextResponse.json(
        {
          error: {
            code: 'servicio_no_encontrado',
            message: 'Servicio no encontrado',
          },
        },
        { status: 404 }
      );
    }

    if (usuaria.rol === 'clienta' && !servicio.activo) {
      return NextResponse.json(
        {
          error: {
            code: 'servicio_no_encontrado',
            message: 'Servicio no encontrado',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(servicio, { status: 200 });
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

/**
 * PATCH /api/servicios/[id] (Exclusivo Admin)
 *
 * Modifica parcialmente un servicio:
 * - Requiere rol admin (401 sin sesión, 403 si es clienta).
 * - Desactivar un servicio se realiza mediante { activo: false }.
 *   Nunca se borra físicamente para preservar el historial de citas.
 * - Valida esquema parcial con Zod (precio > 0, duración múltiplo de 5, etc.).
 * - Si se actualiza el nombre, verifica unicidad con otros servicios.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requireRol('admin');
    const { id } = await context.params;

    const servicioExistente = db.servicios.findById(id);
    if (!servicioExistente) {
      return NextResponse.json(
        {
          error: {
            code: 'servicio_no_encontrado',
            message: 'Servicio no encontrado',
          },
        },
        { status: 404 }
      );
    }

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

    const parseResult = actualizarServicioSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(formatZodError(parseResult.error), {
        status: 400,
      });
    }

    const datos = parseResult.data;

    // Si se envía un nombre, validar que no colisione con otro servicio distinto
    if (datos.nombre) {
      const nombreNormalizado = datos.nombre.trim();
      const otro = db.servicios.findByNombre(nombreNormalizado);
      if (otro && otro.id !== id) {
        return NextResponse.json(
          {
            error: {
              code: 'nombre_duplicado',
              message: 'Ya existe un servicio con ese nombre',
              campos: {
                nombre: 'Ya existe un servicio con ese nombre',
              },
            },
          },
          { status: 400 }
        );
      }
    }

    const servicioActualizado = db.servicios.update(id, datos);

    return NextResponse.json(servicioActualizado, { status: 200 });
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

/**
 * DELETE /api/servicios/[id] (Prohibido explícitamente)
 *
 * El borrado físico está prohibido para mantener la integridad referencial del historial de citas.
 * La desactivación debe realizarse vía PATCH con { activo: false }.
 */
export async function DELETE() {
  return NextResponse.json(
    {
      error: {
        code: 'metodo_no_permitido',
        message:
          'Los servicios no pueden eliminarse físicamente para no romper el historial. Utilice PATCH con { activo: false } para desactivarlos.',
      },
    },
    { status: 405 }
  );
}
