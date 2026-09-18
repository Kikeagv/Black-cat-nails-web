import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { formatZodError, handleAuthError, requireSession } from '@/server/session';
import { calcularDuracionTotal, calcularHorarios } from '@/domain/disponibilidad';
import { HORARIO } from '@/config';
import { consultaDisponibilidadSchema } from '@/schemas';
import { RespuestaDisponibilidad, Servicio } from '@/types';

/**
 * GET /api/disponibilidad (Autenticada)
 *
 * Devuelve los horarios disponibles de un día para un conjunto de servicios.
 * Query params requeridos:
 * - fecha: 'YYYY-MM-DD'
 * - servicios: 'srv_1,srv_2'
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Validar que exista una sesión activa
    await requireSession();

    // 2. Extraer y validar parámetros de la query con Zod
    const url = new URL(request.url);
    const rawFecha = url.searchParams.get('fecha') ?? '';
    const rawServicios = url.searchParams.get('servicios') ?? '';

    const validacion = consultaDisponibilidadSchema.safeParse({
      fecha: rawFecha,
      servicios: rawServicios,
    });

    if (!validacion.success) {
      return NextResponse.json(formatZodError(validacion.error), { status: 400 });
    }

    const { fecha, servicios: serviciosParam } = validacion.data;

    // 3. Validar fecha pasada respecto al tiempo en El Salvador (UTC-6)
    const ahora = new Date();
    const ahoraElSalvadorMs = ahora.getTime() - 6 * 60 * 60 * 1000;
    const hoyElSalvador = new Date(ahoraElSalvadorMs).toISOString().slice(0, 10);

    if (fecha < hoyElSalvador) {
      return NextResponse.json(
        {
          error: {
            code: 'fecha_pasada',
            message: 'No se puede consultar disponibilidad en una fecha pasada',
          },
        },
        { status: 400 }
      );
    }

    // Si es hoy, validar si ya concluyó el horario de atención para el día
    const [year, month, day] = fecha.split('-').map(Number);
    const diaSemana = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const horarioDia = HORARIO[diaSemana as keyof typeof HORARIO];

    if (horarioDia) {
      const cierreMs = Date.parse(`${fecha}T${horarioDia.cierre}:00-06:00`);
      if (fecha === hoyElSalvador && ahora.getTime() >= cierreMs) {
        return NextResponse.json(
          {
            error: {
              code: 'fecha_pasada',
              message: 'La jornada de atención para la fecha solicitada ya ha finalizado',
            },
          },
          { status: 400 }
        );
      }
    }

    // 4. Validar existencia y estado activo de los servicios
    const servicioIds = serviciosParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (servicioIds.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'servicios_requeridos',
            message: 'Debe especificar al menos un ID de servicio',
          },
        },
        { status: 400 }
      );
    }

    const serviciosEncontrados: Servicio[] = [];
    for (const id of servicioIds) {
      const servicio = db.servicios.findById(id);
      if (!servicio) {
        return NextResponse.json(
          {
            error: {
              code: 'servicio_inexistente',
              message: `El servicio con ID "${id}" no existe`,
            },
          },
          { status: 400 }
        );
      }
      if (!servicio.activo) {
        return NextResponse.json(
          {
            error: {
              code: 'servicio_inactivo',
              message: `El servicio "${servicio.nombre}" no se encuentra activo`,
            },
          },
          { status: 400 }
        );
      }
      serviciosEncontrados.push(servicio);
    }

    // 5. Calcular duración total usando la función pura de dominio
    const duracionTotalMin = calcularDuracionTotal(serviciosEncontrados);

    // 6. Obtener citas registradas para ese día
    const citasDelDia = db.citas
      .list()
      .filter((cita) => cita.inicio.startsWith(fecha));

    // 7. Calcular disponibilidad de bloques con la función pura de dominio
    const horarios = calcularHorarios(
      fecha,
      duracionTotalMin,
      citasDelDia,
      HORARIO,
      ahora
    );

    const respuesta: RespuestaDisponibilidad = {
      fecha,
      duracionTotalMin,
      horarios,
    };

    return NextResponse.json(respuesta, { status: 200 });
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
