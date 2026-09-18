'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const { usuaria, cargando, logout } = useAuth();

  if (cargando) {
    return (
      <main className="min-h-screen bg-[var(--bg-base)] text-white p-8 flex items-center justify-center">
        <p className="text-sm text-white/60">Cargando panel administrativo...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-white p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-display-32 font-serif">Panel de Control</h1>
          <p className="text-sm text-[var(--accent)]">
            Sesión activa como Administradora: {usuaria?.nombre}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => logout()}>
          Cerrar sesión
        </Button>
      </div>
      <p className="text-sm text-white/80">
        Panel administrativo listo. (Los layouts y dashboard se desplegarán en los tickets BCN-12 y BCN-27).
      </p>
    </main>
  );
}
