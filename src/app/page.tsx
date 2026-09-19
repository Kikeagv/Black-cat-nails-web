import { redirect } from 'next/navigation';

/**
 * RUTA PRINCIPAL (/) — BLACK CAT NAILS WEB
 *
 * Redirige a /login según la especificación de navegación y requerimientos del usuario.
 * Las usuarias con sesión activa son redirigidas a su panel correspondiente (/app o /admin)
 * directamente en el proxy de middleware.
 */
export default function Home() {
  redirect('/login');
}
