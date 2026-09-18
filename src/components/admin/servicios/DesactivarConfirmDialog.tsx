'use client';

/**
 * DIÁLOGO DE CONFIRMACIÓN DE DESACTIVACIÓN — BLACK CAT NAILS WEB (BCN-15)
 *
 * Exige confirmación explícita antes de desactivar un servicio.
 * Explica a la administradora que la acción es una desactivación lógica
 * y que el historial de citas no se verá alterado.
 */

import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Servicio } from '@/types';
import { toast } from 'sonner';

interface DesactivarConfirmDialogProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  servicio: Servicio | null;
  onConfirmar: (id: string) => Promise<void>;
}

export function DesactivarConfirmDialog({
  abierto,
  onOpenChange,
  servicio,
  onConfirmar,
}: DesactivarConfirmDialogProps) {
  const [procesando, setProcesando] = useState(false);

  if (!servicio) return null;

  const handleConfirmar = async () => {
    setProcesando(true);
    try {
      await onConfirmar(servicio.id);
      toast.success(`El servicio "${servicio.nombre}" ha sido desactivado`);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'No se pudo desactivar el servicio'
      );
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1E1610] border border-white/10 text-white p-6 rounded-[20px]">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="size-5" />
            <DialogTitle className="text-display-24 font-serif text-white">
              ¿Desactivar servicio?
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-white/70 leading-relaxed">
            ¿Estás segura de que deseas desactivar el servicio{' '}
            <strong className="text-white font-semibold">
              &quot;{servicio.nombre}&quot;
            </strong>
            ?
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-200/90 leading-relaxed">
          <p>
            El servicio dejará de estar disponible para que las clientas lo agenden en
            el catálogo web. <strong>Nunca se borrará del sistema</strong> para no romper
            la integridad ni los reportes de citas pasadas. Podrás reactivarlo en
            cualquier momento.
          </p>
        </div>

        <DialogFooter className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={procesando}
            className="text-xs border-white/20"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmar}
            disabled={procesando}
            className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium"
          >
            {procesando ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Desactivando...</span>
              </>
            ) : (
              'Sí, desactivar servicio'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
