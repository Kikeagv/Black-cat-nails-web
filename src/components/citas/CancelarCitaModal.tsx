'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Cita } from '@/types';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface CancelarCitaModalProps {
  cita: Cita | null;
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: (id: string) => Promise<void>;
  cargando?: boolean;
}

export function CancelarCitaModal({
  cita,
  abierto,
  onCerrar,
  onConfirmar,
  cargando = false,
}: CancelarCitaModalProps) {
  if (!cita) return null;

  const nombresServicios = cita.servicios.map((s) => s.nombre).join(', ');
  const fechaStr = cita.inicio.slice(0, 10);
  const horaStr = cita.inicio.slice(11, 16);

  const handleConfirm = async () => {
    await onConfirmar(cita.id);
  };

  return (
    <Dialog open={abierto} onOpenChange={(open) => !cargando && !open && onCerrar()}>
      <DialogContent className="sm:max-w-md bg-[#1A1209] border border-white/15 text-white p-6 rounded-[20px]">
        <DialogHeader className="gap-3">
          <div className="size-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertTriangle className="size-6" />
          </div>
          <DialogTitle className="text-xl font-serif text-white">
            ¿Deseas cancelar esta cita?
          </DialogTitle>
          <DialogDescription className="text-white/70 text-sm leading-relaxed">
            Estás a punto de cancelar tu cita de{' '}
            <strong className="text-white font-medium">{nombresServicios}</strong> programada
            para el <strong className="text-white font-medium">{fechaStr} a las {horaStr} hs</strong>.
            Esta acción liberará el horario reservado y no se puede revertir.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex-col-reverse sm:flex-row gap-2 border-t-0 bg-transparent p-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCerrar}
            disabled={cargando}
            className="w-full sm:w-auto border-white/15 text-white/80 hover:text-white hover:bg-white/10"
          >
            No, conservar cita
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={cargando}
            className="w-full sm:w-auto bg-[#C1524F] hover:bg-[#C1524F]/90 text-white gap-2 font-semibold"
          >
            {cargando && <Loader2 className="size-4 animate-spin" />}
            Sí, cancelar cita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
