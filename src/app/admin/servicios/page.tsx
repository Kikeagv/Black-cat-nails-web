'use client';

import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function AdminServiciosPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-1">
        <h1 className="text-display-32 font-serif text-white">Catálogo de Servicios</h1>
        <p className="text-sm text-[var(--accent)]">
          Administración de servicios, precios, duraciones y consumos
        </p>
      </div>

      <Card className="p-6 rounded-[16px] border border-white/10 bg-card/60 backdrop-blur space-y-4">
        <div className="flex items-center gap-3 text-[var(--primary)]">
          <Sparkles className="size-6" />
          <h2 className="text-lg font-semibold text-white">Módulo CRUD de Servicios (RF-02)</h2>
        </div>
        <p className="text-sm text-white/80">
          La gestión completa de servicios y precios se implementará en el ticket BCN-15 (consumiendo CatalogoContext de BCN-14).
        </p>
      </Card>
    </div>
  );
}
