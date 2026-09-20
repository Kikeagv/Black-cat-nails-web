'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Package, Sparkles } from 'lucide-react';
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
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { crearInsumoSchema, UnidadInsumo } from '@/schemas/insumo';
import { Insumo } from '@/types';
import { useInventario } from '@/context/InventarioContext';
import { ApiError } from '@/services/http';

export const UNIDADES_INSUMO: { valor: UnidadInsumo; etiqueta: string }[] = [
  { valor: 'ml', etiqueta: 'Mililitros (ml)' },
  { valor: 'g', etiqueta: 'Gramos (g)' },
  { valor: 'unidad', etiqueta: 'Unidades (unidad)' },
];

interface InsumoFormDialogProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  insumoAEditar?: Insumo | null;
}

type FormValues = z.input<typeof crearInsumoSchema>;

export function InsumoFormDialog({
  abierto,
  onOpenChange,
  insumoAEditar,
}: InsumoFormDialogProps) {
  const { crearInsumo, editarInsumo } = useInventario();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const esEdicion = Boolean(insumoAEditar);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(crearInsumoSchema),
    defaultValues: {
      nombre: '',
      unidad: 'ml',
      existencia: 100,
      minimo: 50,
      costo: 0.1,
    },
  });

  useEffect(() => {
    if (abierto) {
      if (insumoAEditar) {
        reset({
          nombre: insumoAEditar.nombre,
          unidad: insumoAEditar.unidad as UnidadInsumo,
          existencia: insumoAEditar.existencia,
          minimo: insumoAEditar.minimo,
          costo: insumoAEditar.costo,
        });
      } else {
        reset({
          nombre: '',
          unidad: 'ml',
          existencia: 100,
          minimo: 50,
          costo: 0.1,
        });
      }
    }
  }, [abierto, insumoAEditar, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      setErrorGeneral(null);

      const payload = {
        nombre: values.nombre.trim(),
        unidad: values.unidad as UnidadInsumo,
        existencia: Number(values.existencia),
        minimo: Number(values.minimo),
        costo: Number(values.costo),
      };

      if (esEdicion && insumoAEditar) {
        await editarInsumo(insumoAEditar.id, payload);
        toast.success(`Insumo "${payload.nombre}" actualizado correctamente.`);
      } else {
        await crearInsumo(payload);
        toast.success(`Insumo "${payload.nombre}" creado exitosamente.`);
      }

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
        setErrorGeneral(err.message || 'Error de validación en el servidor.');
      } else {
        const msg =
          err instanceof Error
            ? err.message
            : 'Ocurrió un error al procesar el insumo.';
        setErrorGeneral(msg);
        toast.error(msg);
      }
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-white/10 bg-[#1A1209] text-white p-6 rounded-[16px]">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2 text-[var(--primary)]">
            <Package className="size-5" />
            <DialogTitle className="font-serif text-xl font-bold text-white">
              {esEdicion ? 'Editar insumo' : 'Nuevo insumo de inventario'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-white/60">
            {esEdicion
              ? 'Modifica las existencias, mínimo de alerta o costo del insumo.'
              : 'Registra un nuevo insumo consumible por los servicios del salón.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {errorGeneral && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              {errorGeneral}
            </div>
          )}

          {/* Nombre del insumo */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/80">
              Nombre del insumo *
            </label>
            <Input
              {...register('nombre')}
              placeholder="Ej: Acrílico en polvo, Tips, Removedor..."
              disabled={isSubmitting}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[var(--primary)]"
            />
            {errors.nombre && (
              <p className="text-[11px] text-red-400">{errors.nombre.message}</p>
            )}
          </div>

          {/* Unidad de medida */}
          <Field data-invalid={Boolean(errors.unidad)} className="gap-1.5">
            <FieldLabel
              htmlFor="insumo-unidad"
              className="text-xs font-medium text-white/80"
            >
              Unidad de medida *
            </FieldLabel>
            <NativeSelect
              id="insumo-unidad"
              aria-invalid={Boolean(errors.unidad)}
              aria-describedby={
                errors.unidad ? 'insumo-unidad-error' : undefined
              }
              {...register('unidad')}
              disabled={isSubmitting}
              className="w-full"
            >
              {UNIDADES_INSUMO.map((u) => (
                <NativeSelectOption key={u.valor} value={u.valor}>
                  {u.etiqueta}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError
              id="insumo-unidad-error"
              className="text-[11px] text-red-400"
            >
              {errors.unidad?.message}
            </FieldError>
          </Field>

          {/* Fila: Existencia y Mínimo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/80">
                Existencia actual *
              </label>
              <Input
                type="number"
                step="any"
                {...register('existencia', { valueAsNumber: true })}
                disabled={isSubmitting}
                className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
              />
              {errors.existencia && (
                <p className="text-[11px] text-red-400">
                  {errors.existencia.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/80">
                Stock mínimo de alerta *
              </label>
              <Input
                type="number"
                step="any"
                {...register('minimo', { valueAsNumber: true })}
                disabled={isSubmitting}
                className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
              />
              {errors.minimo && (
                <p className="text-[11px] text-red-400">
                  {errors.minimo.message}
                </p>
              )}
            </div>
          </div>

          {/* Costo unitario */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/80">
              Costo unitario (USD) *
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
                {...register('costo', { valueAsNumber: true })}
                disabled={isSubmitting}
                className="pl-7 bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
              />
            </div>
            <p className="text-[10px] text-white/40">
              Costo de reposición por cada unidad/ml/g
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
              className="bg-[var(--primary)] text-[#1A1209] font-medium hover:bg-[var(--primary)]/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 size-4" />
                  {esEdicion ? 'Guardar cambios' : 'Crear insumo'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
