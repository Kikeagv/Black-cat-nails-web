'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SemanaHeaderProps {
  rangoTexto: string;
  onSemanaAnterior: () => void;
  onSemanaSiguiente: () => void;
  onNuevaCita: () => void;
}

export function SemanaHeader({
  rangoTexto,
  onSemanaAnterior,
  onSemanaSiguiente,
  onNuevaCita,
}: SemanaHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
        Agenda
      </h1>

      <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
        {/* Navegación semanal */}
        <div className="flex items-center gap-1.5 bg-white/4 border border-white/10 rounded-lg p-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onSemanaAnterior}
            className="size-7 p-0 text-white/70 hover:text-white hover:bg-white/10 rounded-md"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <span className="font-sans font-semibold text-xs sm:text-sm text-white px-2 whitespace-nowrap min-w-[110px] text-center">
            {rangoTexto}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onSemanaSiguiente}
            className="size-7 p-0 text-white/70 hover:text-white hover:bg-white/10 rounded-md"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Botón Nueva cita manual */}
        <Button
          type="button"
          onClick={onNuevaCita}
          className="bg-[#E070C4] hover:bg-[#E070C4]/90 text-[#1A1209] font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-2 h-auto rounded-lg gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>Nueva cita manual</span>
        </Button>
      </div>
    </div>
  );
}
