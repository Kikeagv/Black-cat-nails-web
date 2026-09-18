'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function ClientaAppPage() {
  const { usuaria, cargando, logout } = useAuth();

  if (cargando) {
    return (
      <main className="min-h-screen bg-[var(--bg-base)] text-white p-8 flex items-center justify-center">
        <p className="text-sm text-white/60">Cargando catálogo...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-white p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-display-32 font-serif">¡Hola, {usuaria?.nombre || 'Clienta'}!</h1>
          <p className="text-sm text-[var(--accent)]">Bienvenida a tu panel de reservas</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => logout()}>
          Cerrar sesión
        </Button>
      </div>
      <p className="text-sm text-white/80">
        Panel de clienta listo. (El catálogo completo y agendamiento se desplegarán en los tickets BCN-16 y BCN-21).
      </p>
    </main>
  );
}
