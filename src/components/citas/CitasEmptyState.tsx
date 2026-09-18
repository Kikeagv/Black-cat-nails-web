'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarPlus, Sparkles, Cat } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';

interface CitasEmptyStateProps {
  pestana: 'proximas' | 'historial';
}

export function CitasEmptyState({ pestana }: CitasEmptyStateProps) {
  const esProximas = pestana === 'proximas';

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-[20px] border border-white/10 bg-card/40 backdrop-blur space-y-5">
      {/* Ilustración / Ícono de Gato */}
      <div className="relative size-24 rounded-full bg-white/5 border border-white/15 flex items-center justify-center shadow-inner">
        <div className="size-16 rounded-full bg-[var(--surface)]/20 border border-[var(--surface)]/40 flex items-center justify-center text-[var(--primary)]">
          <Cat className="size-9 stroke-[1.8]" />
        </div>
        <div className="absolute top-1 right-1 text-[var(--accent)] animate-pulse">
          <Sparkles className="size-5" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-xl font-serif font-semibold text-white">
          {esProximas ? 'No tenés citas próximas' : 'No tenés citas en tu historial'}
        </h3>
        <p className="text-sm text-white/70 leading-relaxed">
          {esProximas
            ? 'Agendá tu primera cita y dejá tus uñas perfectas con nuestras especialistas.'
            : 'Aquí se mostrarán las citas que hayas completado o cancelado anteriormente.'}
        </p>
      </div>

      {esProximas && (
        <Link
          href="/app/agendar"
          className={cn(
            buttonVariants({ variant: 'default', size: 'lg' }),
            'rounded-[16px] gap-2 font-semibold shadow-md hover:scale-[1.01] transition-transform'
          )}
        >
          <CalendarPlus className="size-4" />
          + Agendar cita
        </Link>
      )}
    </div>
  );
}
