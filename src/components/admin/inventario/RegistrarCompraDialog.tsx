'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ShoppingBag, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registrarCompraSchema } from '@/schemas/insumo';
import { Insumo } from '@/types';
import { useInventario } from '@/context/InventarioContext';
import { ApiError } from '@/services/http';

interface RegistrarCompraDialogProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  insumo: Insumo | null;
}

type FormValues = z.input<typeof registrarCompraSchema>;

export function RegistrarCompraDialog({
  abierto,
  onOpenChange,
  insumo,
}: RegistrarCompraDialogProps) {
  const { registrarCompra } = useInventario();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(registrarCompraSchema),
    defaultValues: {
      cantidadComprada: 50,
      costo: insumo?.costo ?? 0.1,
    },
  });

  useEffect(() => {
    if (abierto && insumo) {
      reset({
        cantidadComprada: insumo.minimo > 0 ? insumo.minimo : 50,
        costo: insumo.costo,
      });
    }
  }, [abierto, insumo, reset]);

  const cantObservada = useWatch({
    control,
    name: 'cantidadComprada',
  });
  const cantidadValida =
    typeof cantObservada === 'number' && !isNaN(cantObservada) && cantObservada > 0
      ? cantObservada
      : 0;

  const stockActual = insumo ? insumo.existencia : 0;
  const stockResultante = Number((stockActual + cantidadValida).toFixed(2));
  const saldraDeCritico =
    insumo &&
    insumo.estado === 'critico' &&
    stockResultante > insumo.minimo;

  const onSubmit = async (values: FormValues) => {
    if (!insumo) return;

    try {
      setErrorGeneral(null);

      const payload = {
        cantidadComprada: Number(values.cantidadComprada),
        costo: values.costo !== undefined ? Number(values.costo) : undefined,
      };

      const actualizado = await registrarCompra(insumo.id, payload);
      toast.success(
        `Compra registrada: +${payload.cantidadComprada} ${insumo.unidad} para "${insumo.nombre}". Nuevo stock: ${actualizado.existencia} ${insumo.unidad}`
      );
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.campos) {
        Object.entries(err.campos).forEach(([campo, mensajes]) => {
          if (Array.isArray(mensajes) && mensajes.length > 0) {
            setError(campo as keyof FormValues, {
              type: 'server',
              message: mensajes[0],
            });
          }
        });
        setErrorGeneral(err.message || 'Error de validación al registrar compra.');
      } else {
        const msg =
          err instanceof Error
            ? err.message
            : 'No se pudo registrar la compra del insumo.';
        setErrorGeneral(msg);
        toast.error(msg);
      }
    }
  };

  if (!insumo) return null;

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] border-white/10 bg-[#1A1209] text-white p-6 rounded-[16px]">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShoppingBag className="size-5" />
            <DialogTitle className="font-serif text-xl font-bold text-white">
              Registrar compra de insumo
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-white/60">
            Suma nuevas existencias a <span className="text-white font-medium">{insumo.nombre}</span> y actualiza su costo si varió.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {errorGeneral && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              {errorGeneral}
            </div>
          )}

          {/* Tarjeta resumen de stock actual */}
          <div className="p-3.5 rounded-[12px] bg-white/5 border border-white/8 space-y-2">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Existencia actual:</span>
              <span className="font-medium text-white">
                {insumo.existencia} {insumo.unidad}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Mínimo requerido:</span>
              <span className="text-white/60">
                {insumo.minimo} {insumo.unidad}
              </span>
            </div>
            <div className="border-t border-white/10 pt-2 flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--accent)]">
                Stock resultante estimado:
              </span>
              <span className="text-sm font-bold text-emerald-300 flex items-center gap-1">
                {stockResultante} {insumo.unidad}
                <ArrowUpRight className="size-3.5" />
              </span>
            </div>
          </div>

          {saldraDeCritico && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>Esta compra restablecerá el stock por encima del mínimo.</span>
            </div>
          )}

          {/* Cantidad comprada */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/80">
              Cantidad comprada ({insumo.unidad}) *
            </label>
            <Input
              type="number"
              step="any"
              min="0.01"
              {...register('cantidadComprada', { valueAsNumber: true })}
              disabled={isSubmitting}
              className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-400"
              placeholder={`Ej: 50 ${insumo.unidad}`}
            />
            {errors.cantidadComprada && (
              <p className="text-[11px] text-red-400">
                {errors.cantidadComprada.message}
              </p>
            )}
          </div>

          {/* Costo unitario opcional */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/80">
              Costo unitario de compra (USD)
            </label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-xs leading-none text-white/40"
              >
                $
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('costo', { valueAsNumber: true })}
                disabled={isSubmitting}
                className="pl-7 bg-white/5 border-white/10 text-white focus-visible:ring-emerald-400"
              />
            </div>
            <p className="text-[10px] text-white/40">
              Actualiza el costo unitario por {insumo.unidad} si el precio de adquisición cambió.
            </p>
            {errors.costo && (
              <p className="text-[11px] text-red-400">{errors.costo.message}</p>
            )}
          </div>

          <DialogFooter className="pt-4 flex items-center justify-end gap-2 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 text-white font-medium hover:bg-emerald-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <ShoppingBag className="mr-1.5 size-4" />
                  Sumar al inventario
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
