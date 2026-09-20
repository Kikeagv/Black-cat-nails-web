import { z } from 'zod';

export const consumoInsumoSchema = z.object({
  insumoId: z.string().min(1, 'El ID del insumo es requerido'),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
});

export const baseServicioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio'),
  categoria: z
    .string()
    .trim()
    .min(1, 'La categoría es obligatoria'),
  precio: z
    .number()
    .positive('El precio debe ser mayor a 0'),
  duracionMin: z
    .number()
    .int('La duración debe ser un número entero')
    .min(10, 'La duración mínima es de 10 minutos')
    .max(240, 'La duración máxima es de 240 minutos')
    .refine((val) => val % 5 === 0, 'La duración debe ser múltiplo de 5 minutos'),
  cicloRetornoDias: z
    .number()
    .int('El ciclo de retorno debe ser un número entero')
    .min(0, 'El ciclo de retorno no puede ser negativo')
    .max(90, 'El ciclo de retorno no puede superar 90 días')
    .refine((val) => val === 0 || val >= 7, 'El ciclo debe ser 0 o entre 7 y 90 días'),
  activo: z.boolean(),
  consumos: z.array(consumoInsumoSchema),
});

export const crearServicioSchema = baseServicioSchema.extend({
  activo: z.boolean().default(true),
  consumos: z.array(consumoInsumoSchema).default([]),
});

export const actualizarServicioSchema = baseServicioSchema.partial();

export type ConsumoInsumoInput = z.infer<typeof consumoInsumoSchema>;
export type CrearServicioInput = z.infer<typeof crearServicioSchema>;
export type ActualizarServicioInput = z.infer<typeof actualizarServicioSchema>;
