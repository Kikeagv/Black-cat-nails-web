'use client';

import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function AdminClientasPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-1">
        <h1 className="text-display-32 font-serif text-white">Gestión de Clientas</h1>
        <p className="text-sm text-[var(--accent)]">
          Fichas individuales, historial de citas y notas privadas
        </p>
      </div>

      <Card className="p-6 rounded-[16px] border border-white/10 bg-card/60 backdrop-blur space-y-4">
        <div className="flex items-center gap-3 text-[var(--primary)]">
          <Users className="size-6" />
          <h2 className="text-lg font-semibold text-white">Directorio de clientas</h2>
        </div>
        <p className="text-sm text-white/80">
          El directorio de clientas con filtros y notas privadas se implementará en el ticket BCN-29.
        </p>
      </Card>
    </div>
  );
}
