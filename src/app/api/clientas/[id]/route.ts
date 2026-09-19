import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import {
  formatZodError,
  handleAuthError,
  requireRol,
} from '@/server/session';
import { calcularMetricasClienta, FichaClientaDetalle } from '@/domain/clientas';
import { actualizarUsuariaSchema } from '@/schemas/usuaria';
import { Usuaria } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/clientas/[id] (Exclusivo Admin)
 * Retorna la ficha completa de una clienta: perfil, historial de citas y métricas.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requireRol('admin', request);
    const { id } = await context.params;

    const usuaria = db.usuarias.findById(id);
    if (!usuaria || usuaria.rol !== 'clienta') {
      return NextResponse.json(
        {
          error: {
            code: 'clienta_no_encontrada',
            message: 'Clienta no encontrada',
          },
        },
        { status: 404 }
      );
    }

    const clienta: Usuaria = {
      id: usuaria.id,
      nombre: usuaria.nombre,
      correo: usuaria.correo,
      telefono: usuaria.telefono,
      rol: usuaria.rol,
      inasistencias: usuaria.inasistencias,
      notasPrivadas: usuaria.notasPrivadas,
      creadaEn: usuaria.creadaEn,
    };

    // Historial completo de citas de la clienta ordenadas de la más reciente a la más antigua
    const citas = db.citas
      .list({ clientaId: id })
      .sort((a, b) => b.inicio.localeCompare(a.inicio));

    const metricas = calcularMetricasClienta(clienta, citas);

    const ficha: FichaClientaDetalle = {
      clienta,
      metricas,
      citas,
    };

    return NextResponse.json(ficha, { status: 200 });
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
 * PATCH /api/clientas/[id] (Exclusivo Admin)
 * Actualiza los datos de contacto y las notas privadas de una clienta.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requireRol('admin', request);
    const { id } = await context.params;

    const usuaria = db.usuarias.findById(id);
    if (!usuaria || usuaria.rol !== 'clienta') {
      return NextResponse.json(
        {
          error: {
            code: 'clienta_no_encontrada',
            message: 'Clienta no encontrada',
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

    const parseResult = actualizarUsuariaSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(formatZodError(parseResult.error), {
        status: 400,
      });
    }

    const datos = parseResult.data;
    const cambios: Partial<Usuaria> = {};

    if (datos.nombre !== undefined) {
      cambios.nombre = datos.nombre.trim();
    }
    if (datos.telefono !== undefined) {
      cambios.telefono = datos.telefono.trim();
    }
    if (datos.notasPrivadas !== undefined) {
      cambios.notasPrivadas = datos.notasPrivadas.trim();
    }

    const actualizada = db.usuarias.update(id, cambios);
    if (!actualizada) {
      return NextResponse.json(
        {
          error: {
            code: 'error_actualizar',
            message: 'No se pudieron guardar los cambios de la clienta',
          },
        },
        { status: 500 }
      );
    }

    const clientaSanitizada: Usuaria = {
      id: actualizada.id,
      nombre: actualizada.nombre,
      correo: actualizada.correo,
      telefono: actualizada.telefono,
      rol: actualizada.rol,
      inasistencias: actualizada.inasistencias,
      notasPrivadas: actualizada.notasPrivadas,
      creadaEn: actualizada.creadaEn,
    };

    const citas = db.citas
      .list({ clientaId: id })
      .sort((a, b) => b.inicio.localeCompare(a.inicio));

    const metricas = calcularMetricasClienta(clientaSanitizada, citas);

    return NextResponse.json(
      {
        clienta: clientaSanitizada,
        metricas,
        citas,
      },
      { status: 200 }
    );
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
