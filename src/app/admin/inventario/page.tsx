'use client';

import { Card } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function AdminInventarioPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-1">
        <h1 className="text-display-32 font-serif text-white">Inventario e Insumos</h1>
        <p className="text-sm text-[var(--accent)]">
          Control de existencias, mínimos y alertas de desabastecimiento
        </p>
      </div>

      <Card className="p-6 rounded-[16px] border border-white/10 bg-card/60 backdrop-blur space-y-4">
        <div className="flex items-center gap-3 text-[var(--accent)]">
          <Package className="size-6" />
          <h2 className="text-lg font-semibold text-white">Control de Insumos (RF-06)</h2>
        </div>
        <p className="text-sm text-white/80">
          La gestión de stock, alertas críticas y registro de compras se implementará en el ticket BCN-28.
        </p>
      </Card>
    </div>
  );
}
