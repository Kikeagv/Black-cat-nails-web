import { NextRequest, NextResponse } from 'next/server';
import { leerToken, SESSION_COOKIE_NAME } from '@/server/session';

/**
 * PROXY DE PROTECCIÓN DE RUTAS (Next.js 16) — BLACK CAT NAILS WEB (BCN-10)
 *
 * Controla el acceso a rutas protegidas antes de su renderizado:
 * - /app/*: Exclusivo para rol 'clienta'.
 * - /admin/*: Exclusivo para rol 'admin'.
 * - Sin sesión: Redirige a /login?next=<ruta_original>.
 * - Rol incorrecto: Clienta en /admin va a /app; Admin en /app va a /admin.
 * - Usuaria autenticada en /login o /registro: Redirige a su panel correspondiente.
 * - Acceso a la raíz (/): Si hay sesión, redirige a su panel correspondiente.
 *
 * NOTA DE SEGURIDAD (06-seguridad.md):
 * Este proxy solo protege la capa visual (UI). Los endpoints en /api/* validan el rol
 * independientemente mediante requireRol() como segunda barrera obligatoria.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Decodifica el token de sesión (devuelve null si es inexistente, inválido o expiró)
  const decoded = token ? await leerToken(token) : null;
  const rol = decoded?.rol;

  const esRutaClienta = pathname === '/app' || pathname.startsWith('/app/');
  const esRutaAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const esRutaAuth = pathname === '/login' || pathname === '/registro';
  const esRaiz = pathname === '/';

  // 1. Protección de rutas que requieren autenticación (/app/* y /admin/*)
  if (esRutaClienta || esRutaAdmin) {
    if (!rol) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname + search);
      return NextResponse.redirect(loginUrl);
    }

    // Rol clienta intentando entrar al panel admin
    if (esRutaAdmin && rol !== 'admin') {
      return NextResponse.redirect(new URL('/app', request.url));
    }

    // Rol admin intentando entrar a la vista de clienta
    if (esRutaClienta && rol !== 'clienta') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // 2. Si ya tiene sesión activa e intenta visitar /login o /registro
  if (esRutaAuth && rol) {
    const destino = rol === 'admin' ? '/admin' : '/app';
    return NextResponse.redirect(new URL(destino, request.url));
  }

  // 3. Redirección en la raíz según sesión (05-ui-y-rutas.md)
  if (esRaiz && rol) {
    const destino = rol === 'admin' ? '/admin' : '/app';
    return NextResponse.redirect(new URL(destino, request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    '/',
    '/app/:path*',
    '/admin/:path*',
    '/login',
    '/registro',
  ],
};
