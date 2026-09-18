'use client';

import { Card } from '@/components/ui/card';
import { CalendarPlus } from 'lucide-react';

export default function AgendarPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-display-32 font-serif text-white">Agendar Cita</h1>
        <p className="text-sm text-[var(--accent)]">
          Paso 1: Selecciona tus servicios
        </p>
      </div>

      <Card className="p-6 rounded-[16px] border border-white/10 bg-card/60 backdrop-blur space-y-4">
        <div className="flex items-center gap-3 text-[var(--primary)]">
          <CalendarPlus className="size-6" />
          <h2 className="text-lg font-semibold text-white">Flujo de agendamiento en 3 pasos</h2>
        </div>
        <p className="text-sm text-white/80">
          Este módulo interactivo se implementará en el ticket BCN-21 con cálculo automático de disponibilidad (BCN-17 y BCN-18).
        </p>
      </Card>
    </div>
  );
}
