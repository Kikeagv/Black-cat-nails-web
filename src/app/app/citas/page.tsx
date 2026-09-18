'use client';

import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function MisCitasPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-display-32 font-serif text-white">Mis Citas</h1>
        <p className="text-sm text-[var(--accent)]">
          Próximas citas e historial
        </p>
      </div>

      <Card className="p-6 rounded-[16px] border border-white/10 bg-card/60 backdrop-blur space-y-4">
        <div className="flex items-center gap-3 text-[var(--accent)]">
          <Calendar className="size-6" />
          <h2 className="text-lg font-semibold text-white">Historial de reservas</h2>
        </div>
        <p className="text-sm text-white/80">
          La gestión de citas y cancelación con 12h de anticipación se completará en el ticket BCN-24.
        </p>
      </Card>
    </div>
  );
}
