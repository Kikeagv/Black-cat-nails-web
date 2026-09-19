import { z } from 'zod';

export const unidadInsumoSchema = z.enum(['ml', 'g', 'unidad']);

export const crearInsumoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre del insumo es obligatorio'),
  unidad: unidadInsumoSchema,
  existencia: z
    .number()
    .min(0, 'La existencia no puede ser negativa'),
  minimo: z
    .number()
    .min(0, 'El mínimo no puede ser negativo'),
  costo: z
    .number()
    .min(0, 'El costo no puede ser negativo'),
});

export const registrarCompraSchema = z.object({
  cantidadComprada: z
    .number()
    .positive('La cantidad comprada debe ser mayor a 0'),
  costo: z
    .number()
    .min(0, 'El costo no puede ser negativo')
    .optional(),
});

export const actualizarInsumoSchema = crearInsumoSchema.partial().extend({
  cantidadComprada: z
    .number()
    .positive('La cantidad comprada debe ser mayor a 0')
    .optional(),
});

export type UnidadInsumo = z.infer<typeof unidadInsumoSchema>;
export type CrearInsumoInput = z.infer<typeof crearInsumoSchema>;
export type RegistrarCompraInput = z.infer<typeof registrarCompraSchema>;
export type ActualizarInsumoInput = z.infer<typeof actualizarInsumoSchema>;
