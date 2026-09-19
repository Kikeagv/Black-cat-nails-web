import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { formatZodError, handleAuthError, requireRol } from '@/server/session';
import { calcularEstado } from '@/domain/inventario';
import { crearInsumoSchema } from '@/schemas';

/**
 * GET /api/insumos (Exclusivo Admin)
 * Retorna la lista de insumos de inventario en el sistema con estado calculado (RN-04).
 */
export async function GET(request?: NextRequest) {
  try {
    await requireRol('admin', request);
    const insumos = db.insumos.list().map((insumo) => ({
      ...insumo,
      estado: calcularEstado(insumo),
    }));
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

/**
 * POST /api/insumos (Exclusivo Admin)
 * Crea un nuevo insumo en el inventario.
 */
export async function POST(request: NextRequest) {
  try {
    await requireRol('admin', request);

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

    const parseResult = crearInsumoSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(formatZodError(parseResult.error), {
        status: 400,
      });
    }

    const nuevo = db.insumos.create({
      nombre: parseResult.data.nombre.trim(),
      unidad: parseResult.data.unidad,
      existencia: Number(parseResult.data.existencia.toFixed(2)),
      minimo: Number(parseResult.data.minimo.toFixed(2)),
      costo: Number(parseResult.data.costo.toFixed(2)),
    });

    const resultado = {
      ...nuevo,
      estado: calcularEstado(nuevo),
    };

    return NextResponse.json(resultado, { status: 201 });
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
