'use client';

/**
 * FORMULARIO UNIFICADO DE CREACIÓN Y EDICIÓN DE SERVICIOS — BLACK CAT NAILS WEB (BCN-15)
 *
 * Diálogo modal con formulario React Hook Form + Zod:
 * - Soporta creación y edición con el mismo componente y esquema.
 * - Selector dinámico de insumos requeridos con cantidad y unidad.
 * - Validación campo a campo con mensajes descriptivos.
 * - Estados de carga y retroalimentación mediante Sonner toast.
 */

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Sparkles, Package } from 'lucide-react';
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
import { crearServicioSchema, CrearServicioInput } from '@/schemas/servicio';
import { Insumo, Servicio } from '@/types';
import { useCatalogo } from '@/context/CatalogoContext';
import { ApiError } from '@/services/http';

export const CATEGORIAS_SERVICIO = [
  'Manicura',
  'Pedicura',
  'Nail art',
  'Acrílico',
  'Gel',
] as const;

interface ServicioFormDialogProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  servicioAEditar?: Servicio | null;
  insumosDisponibles: Insumo[];
}

export function ServicioFormDialog({
  abierto,
  onOpenChange,
  servicioAEditar,
  insumosDisponibles,
}: ServicioFormDialogProps) {
  const { crear, editar } = useCatalogo();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const esEdicion = Boolean(servicioAEditar);

  type FormValues = z.input<typeof crearServicioSchema>;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(crearServicioSchema),
    defaultValues: {
      nombre: '',
      categoria: 'Manicura',
      precio: 15,
      duracionMin: 45,
      cicloRetornoDias: 21,
      activo: true,
      consumos: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'consumos',
  });

  // Re-inicializa el formulario cuando cambia el servicio seleccionado o la apertura
  useEffect(() => {
    if (abierto) {
      if (servicioAEditar) {
        reset({
          nombre: servicioAEditar.nombre,
          categoria: servicioAEditar.categoria,
          precio: servicioAEditar.precio,
          duracionMin: servicioAEditar.duracionMin,
          cicloRetornoDias: servicioAEditar.cicloRetornoDias,
          activo: servicioAEditar.activo,
          consumos: servicioAEditar.consumos || [],
        });
      } else {
        reset({
          nombre: '',
          categoria: 'Manicura',
          precio: 15,
          duracionMin: 45,
          cicloRetornoDias: 21,
          activo: true,
          consumos: [],
        });
      }
    }
  }, [abierto, servicioAEditar, reset]);

  const onSubmit = async (values: FormValues) => {
    setErrorGeneral(null);
    const data: CrearServicioInput = {
      ...values,
      activo: values.activo ?? true,
      consumos: values.consumos ?? [],
    };
    try {
      if (esEdicion && servicioAEditar) {
        await editar(servicioAEditar.id, data);
        toast.success(`Servicio "${data.nombre}" actualizado con éxito`);
      } else {
        await crear(data);
        toast.success(`Servicio "${data.nombre}" creado exitosamente`);
      }
      onOpenChange(false);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.campos) {
          Object.entries(err.campos).forEach(([campo, mensaje]) => {
            setError(campo as keyof FormValues, { message: mensaje });
          });
        }
        setErrorGeneral(err.message);
      } else if (err instanceof Error) {
        setErrorGeneral(err.message);
      } else {
        setErrorGeneral('Ocurrió un error inesperado al procesar la solicitud');
      }
    }
  };

  const handleAgregarConsumo = () => {
    // Busca el primer insumo que no esté ya agregado, o el primero de la lista
    const consumosActuales = getValues('consumos') || [];
    const idsUsados = new Set(
      consumosActuales.map((c: { insumoId: string }) => c.insumoId)
    );
    const disponible =
      insumosDisponibles.find((i) => !idsUsados.has(i.id)) ||
      insumosDisponibles[0];

    if (disponible) {
      append({
        insumoId: disponible.id,
        cantidad: 1,
      });
    } else {
      toast.info('No hay insumos disponibles para seleccionar');
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1E1610] border border-white/10 text-white p-6 rounded-[20px]">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-[var(--primary)]">
            <Sparkles className="size-5" />
            <DialogTitle className="text-display-24 font-serif text-white">
              {esEdicion ? 'Editar Servicio' : 'Nuevo Servicio'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[var(--accent)]">
            {esEdicion
              ? `Actualizá las características y los insumos requeridos para ${servicioAEditar?.nombre}.`
              : 'Definí el nombre, categoría, precio, duración y los insumos requeridos del servicio.'}
          </DialogDescription>
        </DialogHeader>

        {errorGeneral && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {errorGeneral}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          {/* Fila 1: Nombre y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-white/90">
                Nombre del servicio *
              </label>
              <Input
                {...register('nombre')}
                placeholder="Ej. Uñas esculpidas en acrílico"
                className="bg-black/20 border-white/15 focus:border-[var(--primary)] text-sm"
              />
              {errors.nombre && (
                <p className="text-xs text-red-400">{errors.nombre.message}</p>
              )}
            </div>

            <Field data-invalid={Boolean(errors.categoria)} className="gap-1.5">
              <FieldLabel
                htmlFor="servicio-categoria"
                className="text-xs font-semibold text-white/90"
              >
                Categoría *
              </FieldLabel>
              <NativeSelect
                id="servicio-categoria"
                aria-invalid={Boolean(errors.categoria)}
                aria-describedby={
                  errors.categoria ? 'servicio-categoria-error' : undefined
                }
                {...register('categoria')}
                className="w-full"
              >
                {CATEGORIAS_SERVICIO.map((cat) => (
                  <NativeSelectOption key={cat} value={cat}>
                    {cat}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError
                id="servicio-categoria-error"
                className="text-xs text-red-400"
              >
                {errors.categoria?.message}
              </FieldError>
            </Field>
          </div>

          {/* Fila 2: Precio, Duración y Ciclo de retorno */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/90">
                Precio (USD) *
              </label>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-sm leading-none text-white/50"
                >
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('precio', { valueAsNumber: true })}
                  placeholder="0.00"
                  className="pl-7 bg-black/20 border-white/15 text-sm"
                />
              </div>
              {errors.precio && (
                <p className="text-xs text-red-400">{errors.precio.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/90">
                Duración (minutos) *
              </label>
              <Input
                type="number"
                step="5"
                min="10"
                max="240"
                {...register('duracionMin', { valueAsNumber: true })}
                placeholder="45"
                className="bg-black/20 border-white/15 text-sm"
              />
              <span className="text-[10px] text-white/50">Múltiplo de 5 (10-240)</span>
              {errors.duracionMin && (
                <p className="text-xs text-red-400">{errors.duracionMin.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/90">
                Ciclo retorno (días) *
              </label>
              <Input
                type="number"
                min="0"
                max="90"
                {...register('cicloRetornoDias', { valueAsNumber: true })}
                placeholder="21"
                className="bg-black/20 border-white/15 text-sm"
              />
              <span className="text-[10px] text-white/50">7 a 90 (0 si no aplica retoque)</span>
              {errors.cicloRetornoDias && (
                <p className="text-xs text-red-400">{errors.cicloRetornoDias.message}</p>
              )}
            </div>
          </div>

          {/* Disponibilidad del servicio */}
          <div className="flex items-center gap-2 p-2.5 bg-black/20 rounded-md border border-white/10 h-10 w-fit">
            <input
              type="checkbox"
              id="activo-check"
              {...register('activo')}
              className="size-4 accent-[var(--primary)] rounded cursor-pointer"
            />
            <label htmlFor="activo-check" className="text-xs text-white/90 cursor-pointer select-none">
              Disponible en catálogo
            </label>
          </div>

          {/* Sección de Insumos Consumidos */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Package className="size-4 text-[var(--accent)]" />
                <span>Insumos consumidos por sesión</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAgregarConsumo}
                className="text-xs gap-1 h-7 border-white/20 hover:bg-white/10"
              >
                <Plus className="size-3" />
                Agregar insumo
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="text-xs text-white/50 italic py-2 bg-black/10 rounded px-3 border border-white/5">
                Este servicio no descuenta insumos de inventario al completarse.
              </p>
            ) : (
              <div className="space-y-2">
                {fields.map((campo, index) => {
                  const insumoSeleccionado = insumosDisponibles.find(
                    (i) => i.id === campo.insumoId
                  );
                  return (
                    <div
                      key={campo.id}
                      className="flex items-center gap-2 bg-black/30 p-2.5 rounded-lg border border-white/10"
                    >
                      {/* Selector de Insumo */}
                      <div className="flex-1">
                        <NativeSelect
                          size="sm"
                          className="w-full"
                          selectClassName="text-xs"
                          aria-label={`Insumo para consumo ${index + 1}`}
                          {...register(`consumos.${index}.insumoId`)}
                        >
                          {insumosDisponibles.map((ins) => (
                            <NativeSelectOption
                              key={ins.id}
                              value={ins.id}
                            >
                              {ins.nombre} ({ins.unidad})
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </div>

                      {/* Input de Cantidad */}
                      <div className="w-28 flex items-center gap-1.5">
                        <Input
                          type="number"
                          step="any"
                          min="0.01"
                          {...register(`consumos.${index}.cantidad`, {
                            valueAsNumber: true,
                          })}
                          placeholder="Cant."
                          className="h-8 text-xs bg-black/40 border-white/15"
                        />
                        <span className="text-xs text-white/60 w-8 truncate">
                          {insumoSeleccionado?.unidad || 'uds'}
                        </span>
                      </div>

                      {/* Botón eliminar consumo */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/40 size-8"
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Eliminar insumo</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            {errors.consumos && (
              <p className="text-xs text-red-400">{errors.consumos.message}</p>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs border-white/20"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs gap-1.5 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : esEdicion ? (
                'Guardar cambios'
              ) : (
                'Crear servicio'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
