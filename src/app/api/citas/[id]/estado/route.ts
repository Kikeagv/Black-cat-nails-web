import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { formatZodError, handleAuthError, requireSession } from '@/server/session';
import { cambiarEstadoCitaSchema } from '@/schemas';
import { validarTransicionEstado } from '@/domain/estadosCita';
import { calcularConsumo, calcularFechaRetoque } from '@/domain/inventario';
import { Cita, Servicio } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/citas/[id]/estado (Autenticada)
 *
 * Cambia el estado de una cita validando transiciones permitidas según el rol y máquina de estados (RN-02):
 * - 200: Cita actualizada
 * - 400: Validación fallida del cuerpo
 * - 401: Sin sesión
 * - 403: Transición no permitida para la clienta o acceso a cita ajena
 * - 404: Cita inexistente
 * - 422: Transición inválida en la máquina de estados o cancelación fuera de tiempo
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const usuaria = await requireSession(request);
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

    // Validar máquina de estados, permisos por rol y anticipación mínima
    const validacion = validarTransicionEstado(
      cita.estado,
      nuevoEstado,
      usuaria.rol,
      cita.inicio
    );

    if (!validacion.valida) {
      return NextResponse.json(
        {
          error: {
            code: validacion.codigo ?? 'transicion_invalida',
            message: validacion.mensaje ?? 'Transición no permitida',
          },
        },
        { status: validacion.status ?? 422 }
      );
    }

    const camposActualizar: Partial<Cita> = { estado: nuevoEstado };

    // Efectos colaterales según la transición (RN-03 / RN-04)
    if (nuevoEstado === 'completada') {
      // 1. Obtener la definición completa de cada servicio de la cita desde el catálogo
      const serviciosCompletos = cita.servicios
        .map((s) => db.servicios.findById(s.servicioId))
        .filter((s): s is Servicio => Boolean(s));

      // 2. Calcular consumos consolidados de insumos
      const consumos = calcularConsumo(serviciosCompletos);

      // 3. Descontar existencias en el inventario garantizando que no queden negativas
      for (const consumo of consumos) {
        const insumo = db.insumos.findById(consumo.insumoId);
        if (insumo) {
          const nuevaExistencia = Math.max(
            0,
            Number((insumo.existencia - consumo.cantidad).toFixed(2))
          );
          db.insumos.update(insumo.id, { existencia: nuevaExistencia });
        }
      }

      // 4. Calcular fecha estimada de retoque
      const fechaRetoque = calcularFechaRetoque(cita.inicio, serviciosCompletos);

      // 5. Asignar los campos correspondientes a la cita
      camposActualizar.insumosDescontados = consumos;
      camposActualizar.montoCobrado = cita.montoCobrado ?? cita.montoTotal;
      if (fechaRetoque) {
        camposActualizar.fechaRetoque = fechaRetoque;
      }
    } else if (nuevoEstado === 'inasistencia') {
      // Incrementar el contador de inasistencias de la clienta
      const clienta = db.usuarias.findById(cita.clientaId);
      if (clienta) {
        const inasistenciasActualizadas = (clienta.inasistencias || 0) + 1;
        db.usuarias.update(clienta.id, {
          inasistencias: inasistenciasActualizadas,
        });
      }
    }

    const actualizada = db.citas.update(id, camposActualizar);
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
