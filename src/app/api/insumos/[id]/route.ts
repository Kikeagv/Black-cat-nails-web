import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import {
  formatZodError,
  handleAuthError,
  requireRol,
} from '@/server/session';
import { calcularEstado } from '@/domain/inventario';
import { actualizarInsumoSchema } from '@/schemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/insumos/[id] (Exclusivo Admin)
 * Retorna un insumo individual con su estado calculado.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requireRol('admin', request);
    const { id } = await context.params;

    const insumo = db.insumos.findById(id);
    if (!insumo) {
      return NextResponse.json(
        {
          error: {
            code: 'insumo_no_encontrado',
            message: 'Insumo no encontrado',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ...insumo,
        estado: calcularEstado(insumo),
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

/**
 * PATCH /api/insumos/[id] (Exclusivo Admin)
 * Edita datos de un insumo existente o registra una compra sumando existencia.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requireRol('admin', request);
    const { id } = await context.params;

    const insumoExistente = db.insumos.findById(id);
    if (!insumoExistente) {
      return NextResponse.json(
        {
          error: {
            code: 'insumo_no_encontrado',
            message: 'Insumo no encontrado',
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

    const parseResult = actualizarInsumoSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(formatZodError(parseResult.error), {
        status: 400,
      });
    }

    const datos = parseResult.data;
    const cambios: Record<string, unknown> = {};

    // Si se registra una compra, suma existencia al stock actual
    if (datos.cantidadComprada !== undefined) {
      const nuevaExistencia = Number(
        (insumoExistente.existencia + datos.cantidadComprada).toFixed(2)
      );
      cambios.existencia = nuevaExistencia;
    } else if (datos.existencia !== undefined) {
      cambios.existencia = Number(datos.existencia.toFixed(2));
    }

    if (datos.nombre !== undefined) {
      cambios.nombre = datos.nombre.trim();
    }
    if (datos.unidad !== undefined) {
      cambios.unidad = datos.unidad;
    }
    if (datos.minimo !== undefined) {
      cambios.minimo = Number(datos.minimo.toFixed(2));
    }
    if (datos.costo !== undefined) {
      cambios.costo = Number(datos.costo.toFixed(2));
    }

    const actualizado = db.insumos.update(id, cambios);
    if (!actualizado) {
      return NextResponse.json(
        {
          error: {
            code: 'insumo_no_encontrado',
            message: 'Insumo no encontrado al actualizar',
          },
        },
        { status: 404 }
      );
    }

    const resultado = {
      ...actualizado,
      estado: calcularEstado(actualizado),
    };

    return NextResponse.json(resultado, { status: 200 });
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
