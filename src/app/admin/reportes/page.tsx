'use client';

import { Card } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function AdminReportesPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-display-32 font-serif text-white">Reportes y Métricas</h1>

      <Card className="p-6 rounded-[16px] border border-white/10 bg-card/60 backdrop-blur space-y-4">
        <div className="flex items-center gap-3 text-[var(--primary)]">
          <BarChart3 className="size-6" />
          <h2 className="text-lg font-semibold text-white">Reportes avanzados del negocio</h2>
        </div>
        <p className="text-sm text-white/80">
          Visualización estadística de ingresos por semana y comportamiento de clientas.
        </p>
      </Card>
    </div>
  );
}
