import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { formatZodError, handleAuthError, requireSession } from '@/server/session';
import { cambiarEstadoCitaSchema } from '@/schemas';
import { CANCELACION_MIN_HORAS } from '@/config';
import { EstadoCita, Rol } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const TRANSICIONES: Record<EstadoCita, EstadoCita[]> = {
  solicitada: ['confirmada', 'cancelada', 'inasistencia'],
  confirmada: ['en_curso', 'cancelada', 'inasistencia'],
  en_curso: ['completada'],
  completada: [],
  cancelada: [],
  inasistencia: [],
};

function puedeTransicionar(
  desde: EstadoCita,
  hacia: EstadoCita,
  rol: Rol
): { permitida: boolean; motivo?: string } {
  const permitidas = TRANSICIONES[desde] || [];
  if (!permitidas.includes(hacia)) {
    return {
      permitida: false,
      motivo: `No se puede pasar de "${desde}" a "${hacia}"`,
    };
  }

  if (rol === 'clienta') {
    if (
      hacia === 'en_curso' ||
      hacia === 'completada' ||
      hacia === 'inasistencia'
    ) {
      return {
        permitida: false,
        motivo: 'Solo la administradora puede realizar esta acción',
      };
    }
  }

  return { permitida: true };
}

/**
 * PATCH /api/citas/[id]/estado (Autenticada)
 *
 * Cambia el estado de una cita validando transiciones permitidas según el rol:
 * - 200: Cita actualizada
 * - 403: Intento de transición restringida a admin
 * - 404: Cita inexistente
 * - 422: Transición inválida en la máquina de estados o cancelación fuera de tiempo
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const usuaria = await requireSession();
    const { id } = await context.params;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        {
          error: {
            code: 'validacion_fallida',
            message: 'Cuerpo de petición inválido',
          },
        },
        { status: 400 }
      );
    }

    const parseResult = cambiarEstadoCitaSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(formatZodError(parseResult.error), { status: 400 });
    }

    const nuevoEstado = parseResult.data.estado;

    const cita = db.citas.findById(id);
    if (!cita) {
      return NextResponse.json(
        {
          error: {
            code: 'cita_no_encontrada',
            message: 'La cita solicitada no existe',
          },
        },
        { status: 404 }
      );
    }

    // Si es clienta, solo puede interactuar con sus propias citas
    if (usuaria.rol === 'clienta' && cita.clientaId !== usuaria.id) {
      return NextResponse.json(
        {
          error: {
            code: 'acceso_denegado',
            message: 'No tiene permisos para modificar esta cita',
          },
        },
        { status: 403 }
      );
    }

    // Validar máquina de estados y permisos por rol
    const validacion = puedeTransicionar(cita.estado, nuevoEstado, usuaria.rol);
    if (!validacion.permitida) {
      const status = validacion.motivo?.includes('administradora') ? 403 : 422;
      return NextResponse.json(
        {
          error: {
            code: status === 403 ? 'permiso_insuficiente' : 'transicion_invalida',
            message: validacion.motivo,
          },
        },
        { status }
      );
    }

    // Si la clienta cancela, validar anticipación mínima de 12 horas
    if (usuaria.rol === 'clienta' && nuevoEstado === 'cancelada') {
      const inicioMs = Date.parse(cita.inicio);
      const horasAnticipacion = (inicioMs - Date.now()) / (1000 * 60 * 60);
      if (horasAnticipacion < CANCELACION_MIN_HORAS) {
        return NextResponse.json(
          {
            error: {
              code: 'cancelacion_tardia',
              message: `Las cancelaciones deben realizarse con al menos ${CANCELACION_MIN_HORAS} horas de anticipación`,
            },
          },
          { status: 422 }
        );
      }
    }

    const actualizada = db.citas.update(id, { estado: nuevoEstado });
    return NextResponse.json(actualizada, { status: 200 });
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
