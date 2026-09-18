import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import {
  formatZodError,
  handleAuthError,
  requireRol,
  requireSession,
} from '@/server/session';
import { crearServicioSchema } from '@/schemas';

/**
 * GET /api/servicios (Autenticada)
 *
 * Catálogo de servicios:
 * - Clienta: recibe exclusivamente los servicios activos (activo: true).
 * - Admin: recibe todos los servicios (o filtra por ?activo=true/false si se especifica).
 */
export async function GET(request: NextRequest) {
  try {
    const usuaria = await requireSession();

    if (usuaria.rol === 'clienta') {
      const servicios = db.servicios.list({ activo: true });
      return NextResponse.json(servicios, { status: 200 });
    }

    // Para rol admin, se permiten opcionalmente filtros de query o todos por defecto
    const url = new URL(request.url);
    const activoParam = url.searchParams.get('activo');
    const filtro =
      activoParam !== null ? { activo: activoParam === 'true' } : undefined;

    const servicios = db.servicios.list(filtro);
    return NextResponse.json(servicios, { status: 200 });
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
 * POST /api/servicios (Exclusivo Admin)
 *
 * Crea un nuevo servicio en el catálogo:
 * - Requiere rol admin (401 sin sesión, 403 si es clienta).
 * - Valida el cuerpo con crearServicioSchema (Zod).
 * - Valida unicidad del nombre (400 con código nombre_duplicado).
 * - Devuelve el servicio creado con código 201 Created.
 */
export async function POST(request: NextRequest) {
  try {
    await requireRol('admin');

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

    const parseResult = crearServicioSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(formatZodError(parseResult.error), {
        status: 400,
      });
    }

    const datos = parseResult.data;
    const existente = db.servicios.findByNombre(datos.nombre.trim());
    if (existente) {
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

    const nuevoServicio = db.servicios.create(datos);

    return NextResponse.json(nuevoServicio, { status: 201 });
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
