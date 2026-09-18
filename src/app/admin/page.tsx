'use client';

import { Card } from '@/components/ui/card';
import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboardPage() {
  const { usuaria } = useAuth();

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-1">
        <h1 className="text-display-32 font-serif text-white">Dashboard</h1>
        <p className="text-sm text-[var(--accent)]">
          Bienvenida, {usuaria?.nombre || 'Administradora'}. Resumen del negocio y operaciones de hoy.
        </p>
      </div>

      <Card className="p-6 rounded-[16px] border border-white/10 bg-card/60 backdrop-blur space-y-4">
        <div className="flex items-center gap-3 text-[var(--primary)]">
          <LayoutDashboard className="size-6" />
          <h2 className="text-lg font-semibold text-white">Panel principal con métricas en tiempo real</h2>
        </div>
        <p className="text-sm text-white/80">
          Los KPIs de citas de hoy, ingresos del mes, clientas activas, alertas y gráficas semanales se integrarán en el ticket BCN-27 sobre el endpoint BCN-26.
        </p>
      </Card>
    </div>
  );
}
