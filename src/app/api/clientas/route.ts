import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { handleAuthError, requireRol } from '@/server/session';
import { Usuaria } from '@/types';

/**
 * GET /api/clientas (Exclusivo Admin)
 * Retorna la lista de clientas registradas en el sistema (sin hash de contraseña).
 */
export async function GET(request?: NextRequest) {
  try {
    await requireRol('admin', request);

    const clientas: Usuaria[] = db.usuarias
      .list({ rol: 'clienta' })
      .map((u) => ({
        id: u.id,
        nombre: u.nombre,
        correo: u.correo,
        telefono: u.telefono,
        rol: u.rol,
        inasistencias: u.inasistencias,
        notasPrivadas: u.notasPrivadas,
        creadaEn: u.creadaEn,
      }));

    // Ordenar alfabéticamente por nombre
    clientas.sort((a, b) => a.nombre.localeCompare(b.nombre));

    return NextResponse.json(clientas, { status: 200 });
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
