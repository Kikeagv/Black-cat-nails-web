'use client';

import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function AdminAgendaPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-1">
        <h1 className="text-display-32 font-serif text-white">Agenda Semanal</h1>
        <p className="text-sm text-[var(--accent)]">
          Control de citas y disponibilidad horaria
        </p>
      </div>

      <Card className="p-6 rounded-[16px] border border-white/10 bg-card/60 backdrop-blur space-y-4">
        <div className="flex items-center gap-3 text-[var(--accent)]">
          <Calendar className="size-6" />
          <h2 className="text-lg font-semibold text-white">Gestión de citas semanales</h2>
        </div>
        <p className="text-sm text-white/80">
          La agenda semanal interactiva con cambio de estados de cita se implementará en el ticket BCN-25.
        </p>
      </Card>
    </div>
  );
}
