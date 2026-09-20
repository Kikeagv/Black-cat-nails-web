import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { formatZodError, handleAuthError, requireSession } from '@/server/session';
import { crearCitaSchema } from '@/schemas';
import { calcularDuracionTotal, seCruzan } from '@/domain/disponibilidad';
import { HORARIO } from '@/config';
import { Cita, EstadoCita, Intervalo, Servicio, ServicioEnCita } from '@/types';

/**
 * Mutex en memoria para serializar la validación de cruces y la inserción
 * de citas, impidiendo condiciones de carrera ante peticiones simultáneas.
 */
let mutexReserva = Promise.resolve();

function sincronizarReserva<T>(fn: () => Promise<T> | T): Promise<T> {
  const proximo = mutexReserva.then(
    () => fn(),
    () => fn()
  );
  mutexReserva = proximo.then(
    () => {},
    () => {}
  );
  return proximo;
}

/**
 * Formatea una marca de tiempo en milisegundos a cadena ISO 8601 con zona El Salvador (-06:00).
 */
function formatearIsoElSalvador(ms: number): string {
  const d = new Date(ms - 6 * 60 * 60 * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}-06:00`;
}

/**
 * GET /api/citas (Autenticada)
 *
 * Listado de citas según rol:
 * - Clienta: recibe exclusivamente sus propias citas (clientaId forzado a su usuaria.id).
 * - Admin: recibe todas las citas (o filtra por clientaId si se incluye en query).
 * - Filtros opcionales: desde, hasta, estado.
 */
export async function GET(request: NextRequest) {
  try {
    const usuaria = await requireSession(request);
    const url = new URL(request.url);

    const desdeParam = url.searchParams.get('desde') || undefined;
    const hastaParam = url.searchParams.get('hasta') || undefined;
    const estadoParam = url.searchParams.get('estado');
    const estado = estadoParam ? (estadoParam as EstadoCita) : undefined;

    // Normalizar fechas para soportar tanto YYYY-MM-DD como ISO completos
    const desde = desdeParam
      ? desdeParam.includes('T')
        ? desdeParam
        : `${desdeParam}T00:00:00-06:00`
      : undefined;

    const hasta = hastaParam
      ? hastaParam.includes('T')
        ? hastaParam
        : `${hastaParam}T23:59:59-06:00`
      : undefined;

    // La clienta solo puede ver sus propias citas
    const clientaId =
      usuaria.rol === 'admin'
        ? url.searchParams.get('clientaId') || undefined
        : usuaria.id;

    const citas = db.citas.list({
      clientaId,
      desde,
      hasta,
      estado,
    });

    // Enriquecer cada cita con los datos vigentes de la clienta
    const citasEnriquecidas = citas.map((cita) => {
      const clienta = db.usuarias.findById(cita.clientaId);
      return {
        ...cita,
        clientaNombre: clienta?.nombre,
        clientaTelefono: clienta?.telefono,
        clientaCorreo: clienta?.correo,
      };
    });

    // Ordenar cronológicamente por inicio
    citasEnriquecidas.sort((a, b) => a.inicio.localeCompare(b.inicio));

    return NextResponse.json(citasEnriquecidas, { status: 200 });
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
 * POST /api/citas (Autenticada)
 *
 * Creación de nueva cita:
 * - Revalida disponibilidad en el servidor (409 si horario ocupado).
 * - Copia nombre, precio y duración de cada servicio (congelados en la cita).
 * - Calcula fin, duracionTotalMin (servicios + 15m prep) y montoTotal.
 * - Asigna estado inicial 'confirmada'.
 */
export async function POST(request: NextRequest) {
  try {
    const usuaria = await requireSession(request);
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

    // 1. Validar esquema con Zod
    const parseResult = crearCitaSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(formatZodError(parseResult.error), { status: 400 });
    }

    const { servicioIds, inicio: rawInicio, notas } = parseResult.data;

    // 2. Determinar la clienta destinataria
    let targetClientaId = usuaria.id;
    if (usuaria.rol === 'admin') {
      if (parseResult.data.clientaId) {
        targetClientaId = parseResult.data.clientaId;
        const clienta = db.usuarias.findById(targetClientaId);
        if (!clienta) {
          return NextResponse.json(
            {
              error: {
                code: 'clienta_no_encontrada',
                message: `La clienta con ID "${targetClientaId}" no existe`,
              },
            },
            { status: 404 }
          );
        }
      }
    }

    // 3. Validar existencia y estado activo de todos los servicios solicitados
    const serviciosCompletos: Servicio[] = [];
    for (const srvId of servicioIds) {
      const servicio = db.servicios.findById(srvId);
      if (!servicio) {
        return NextResponse.json(
          {
            error: {
              code: 'servicio_inexistente',
              message: `El servicio con ID "${srvId}" no existe`,
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
              message: `El servicio "${servicio.nombre}" no está activo`,
            },
          },
          { status: 400 }
        );
      }
      serviciosCompletos.push(servicio);
    }

    // 4. Copia congelada de servicios, cálculo de duración total y monto
    const serviciosEnCita: ServicioEnCita[] = serviciosCompletos.map((s) => ({
      servicioId: s.id,
      nombre: s.nombre,
      precio: s.precio,
      duracionMin: s.duracionMin,
    }));

    const duracionTotalMin = calcularDuracionTotal(serviciosCompletos);
    const montoTotal = Number(
      serviciosCompletos.reduce((total, s) => total + s.precio, 0).toFixed(2)
    );

    // 5. Validar fecha y horario de inicio
    const inicioMs = Date.parse(rawInicio);
    if (isNaN(inicioMs)) {
      return NextResponse.json(
        {
          error: {
            code: 'fecha_invalida',
            message: 'La fecha y hora de inicio no es válida',
          },
        },
        { status: 400 }
      );
    }

    if (inicioMs <= Date.now()) {
      return NextResponse.json(
        {
          error: {
            code: 'fecha_pasada',
            message: 'No se pueden agendar citas en fechas u horarios pasados',
          },
        },
        { status: 400 }
      );
    }

    const finMs = inicioMs + duracionTotalMin * 60 * 1000;
    const inicioIso = formatearIsoElSalvador(inicioMs);
    const finIso = formatearIsoElSalvador(finMs);

    // 6. Validar límites de apertura y cierre del negocio
    const [fechaStr, horaStr] = inicioIso.split('T');
    const [y, m, d] = fechaStr.split('-').map(Number);
    const diaSemana = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const horarioDia = HORARIO[diaSemana as keyof typeof HORARIO];

    if (!horarioDia) {
      return NextResponse.json(
        {
          error: {
            code: 'fuera_de_horario',
            message: 'El salón no cuenta con horario de atención para esta fecha',
          },
        },
        { status: 400 }
      );
    }

    const [iniH, iniM] = horaStr.slice(0, 5).split(':').map(Number);
    const inicioMin = iniH * 60 + iniM;
    const [apH, apM] = horarioDia.apertura.split(':').map(Number);
    const aperturaMin = apH * 60 + apM;
    const [ciH, ciM] = horarioDia.cierre.split(':').map(Number);
    const cierreMin = ciH * 60 + ciM;

    if (inicioMin < aperturaMin || inicioMin + duracionTotalMin > cierreMin) {
      return NextResponse.json(
        {
          error: {
            code: 'fuera_de_horario',
            message:
              'El horario seleccionado excede la jornada de atención del salón',
          },
        },
        { status: 400 }
      );
    }

    // 7. Revalidación de disponibilidad en servidor con sincronización para evitar condiciones de carrera
    return await sincronizarReserva(() => {
      const citasDelDia = db.citas
        .list()
        .filter((c) => c.inicio.startsWith(fechaStr));

      // Solo estados que ocupan agenda
      const citasOcupadas = citasDelDia.filter((c) => {
        return (
          c.estado === 'solicitada' ||
          c.estado === 'confirmada' ||
          c.estado === 'en_curso'
        );
      });

      const intervaloPropuesto: Intervalo = {
        inicio: inicioIso,
        fin: finIso,
      };

      const hayCruce = citasOcupadas.some((c) => seCruzan(intervaloPropuesto, c));
      if (hayCruce) {
        return NextResponse.json(
          {
            error: {
              code: 'horario_ocupado',
              message: 'Ese horario acaba de ocuparse',
            },
          },
          { status: 409 }
        );
      }

      // Crear la cita en memoria
      const nuevaCita: Cita = db.citas.create({
        id: `cit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        clientaId: targetClientaId,
        servicios: serviciosEnCita,
        inicio: inicioIso,
        fin: finIso,
        duracionTotalMin,
        montoTotal,
        estado: 'confirmada',
        notas: notas || undefined,
        creadaEn: formatearIsoElSalvador(Date.now()),
      });

      return NextResponse.json(nuevaCita, { status: 201 });
    });
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
