/**
 * GESTIÓN DE SESIÓN Y AUTENTICACIÓN EN SERVIDOR — BLACK CAT NAILS WEB
 *
 * Consolida toda la mecánica de contraseñas, tokens JWT y cookies httpOnly en un solo
 * módulo, facilitando su sustitución por Firebase Authentication en la Etapa 3.
 *
 * Cumple con la especificación de 06-seguridad.md y los lineamientos de AGENTS.md.
 */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db';
import { Rol, Usuaria, UsuariaConHash } from '@/types';

export const SESSION_COOKIE_NAME = 'bcn_session';
export const TOKEN_EXPIRATION_HOURS = 8;
export const TOKEN_EXPIRATION_SECONDS = TOKEN_EXPIRATION_HOURS * 60 * 60; // 28800s

/**
 * Obtiene la clave secreta para firmar/verificar JWT con el algoritmo HS256.
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET no está configurada en las variables de entorno');
    }
    // Clave de respaldo defensiva de 32+ caracteres solo para desarrollo local si faltara el .env
    return new TextEncoder().encode('fallback-session-secret-black-cat-nails-dev-32ch');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Devuelve la usuaria sin el campo confidencial passwordHash.
 */
export function sanitizarUsuaria(usuariaConHash: UsuariaConHash): Usuaria {
  return {
    id: usuariaConHash.id,
    nombre: usuariaConHash.nombre,
    correo: usuariaConHash.correo,
    telefono: usuariaConHash.telefono,
    rol: usuariaConHash.rol,
    inasistencias: usuariaConHash.inasistencias,
    notasPrivadas: usuariaConHash.notasPrivadas,
    creadaEn: usuariaConHash.creadaEn,
  };
}

/**
 * Formatea errores de validación de Zod con la estructura estándar de 03-api-rest.md.
 */
export function formatZodError(error: z.ZodError) {
  const campos: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'general';
    if (!campos[key]) {
      campos[key] = issue.message;
    }
  }
  return {
    error: {
      code: 'validacion_fallida',
      message: 'Los datos proporcionados no son válidos',
      campos,
    },
  };
}

/**
 * Genera el hash de una contraseña usando bcryptjs con 10 rondas de sal.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/**
 * Compara una contraseña en texto plano contra su hash bcrypt.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Firma un JWT de sesión con jose y SESSION_SECRET.
 * Contenido del payload: { sub: usuariaId, rol }
 * Expiración: 8 horas.
 */
export async function crearToken(usuaria: Pick<Usuaria, 'id' | 'rol'>): Promise<string> {
  return new SignJWT({ rol: usuaria.rol })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(usuaria.id)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRATION_HOURS}h`)
    .sign(getSecretKey());
}

/**
 * Verifica y decodifica un JWT de sesión.
 * Retorna el id (sub) y el rol de la usuaria si el token es válido y no ha expirado.
 */
export async function leerToken(
  token: string
): Promise<{ sub: string; rol: Rol } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
    });

    if (
      typeof payload.sub === 'string' &&
      (payload.rol === 'admin' || payload.rol === 'clienta')
    ) {
      return {
        sub: payload.sub,
        rol: payload.rol as Rol,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Configura la cookie httpOnly con el token de sesión.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_EXPIRATION_SECONDS,
  });
}

/**
 * Elimina la cookie de sesión del navegador.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Obtiene la usuaria autenticada actual a partir de la cookie de sesión y el repositorio en memoria.
 * Retorna la usuaria sin el campo sensible passwordHash, o null si no hay sesión válida.
 */
export async function getSession(): Promise<Usuaria | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }

    const payload = await leerToken(token);
    if (!payload) {
      return null;
    }

    const usuariaConHash = db.usuarias.findById(payload.sub);
    if (!usuariaConHash) {
      return null;
    }

    return sanitizarUsuaria(usuariaConHash);
  } catch {
    return null;
  }
}

/**
 * Error tipado para fallos de autenticación (401) y autorización (403).
 */
export class AuthError extends Error {
  public readonly status: 401 | 403;
  public readonly code: string;

  constructor(status: 401 | 403, code: string, message: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
  }

  public toResponse(): NextResponse {
    return NextResponse.json(
      {
        error: {
          code: this.code,
          message: this.message,
        },
      },
      { status: this.status }
    );
  }
}

/**
 * Exige una sesión activa. Si no existe sesión válida, lanza AuthError con código 401.
 */
export async function requireSession(): Promise<Usuaria> {
  const usuaria = await getSession();
  if (!usuaria) {
    throw new AuthError(
      401,
      'no_autenticado',
      'Debe iniciar sesión para acceder a este recurso'
    );
  }
  return usuaria;
}

/**
 * Exige un rol específico (o uno de varios roles permitidos).
 * Si no hay sesión válida, lanza 401.
 * Si el rol de la usuaria no coincide, lanza 403.
 */
export async function requireRol(rol: Rol | Rol[]): Promise<Usuaria> {
  const usuaria = await requireSession();
  const rolesPermitidos = Array.isArray(rol) ? rol : [rol];

  if (!rolesPermitidos.includes(usuaria.rol)) {
    throw new AuthError(
      403,
      'rol_insuficiente',
      'No tiene permisos para realizar esta acción'
    );
  }

  return usuaria;
}

/**
 * Helper para capturar AuthError y generar la respuesta HTTP correspondiente (401 o 403).
 * Retorna null si el error no es de tipo AuthError.
 */
export function handleAuthError(error: unknown): NextResponse | null {
  if (error instanceof AuthError) {
    return error.toResponse();
  }
  return null;
}
