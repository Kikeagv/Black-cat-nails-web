'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, CalendarPlus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';

interface AvisoRetoqueBannerProps {
  fechaRetoque?: string;
}

export function AvisoRetoqueBanner({ fechaRetoque }: AvisoRetoqueBannerProps) {
  let mensaje =
    '¡Hace más de un mes de tu última visita! Agendá tu próxima cita para mantener tus uñas impecables.';

  if (fechaRetoque) {
    const [, m, d] = fechaRetoque.split('-').map(Number);
    const MESES = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];
    const mesNom = MESES[(m || 1) - 1];
    mensaje = `Tu fecha estimada de retoque recomendada es el ${d} de ${mesNom}. Agendá con anticipación para asegurar tu espacio favorito.`;
  }

  return (
    <div className="relative overflow-hidden rounded-[20px] p-6 border border-[var(--primary)]/30 bg-gradient-to-br from-[#B4476E]/30 via-[#1A1209] to-[#E070C4]/10 shadow-lg space-y-4">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-full bg-[var(--primary)]/20 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] shrink-0 mt-0.5">
          <Sparkles className="size-5" />
        </div>
        <div className="space-y-1 flex-1">
          <h3 className="text-lg font-serif font-semibold text-white flex items-center gap-2">
            Es hora de tu retoque ✨
          </h3>
          <p className="text-sm text-white/80 leading-relaxed">{mensaje}</p>
        </div>
      </div>

      <div className="pt-1">
        <Link
          href="/app/agendar"
          className={cn(
            buttonVariants({ variant: 'default' }),
            'w-full sm:w-auto font-semibold gap-2 shadow-md hover:scale-[1.01] transition-transform'
          )}
        >
          <CalendarPlus className="size-4" />
          + Agendar cita
        </Link>
      </div>
    </div>
  );
}
