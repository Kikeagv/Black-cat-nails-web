import { z } from 'zod';

export const estadoCitaSchema = z.enum([
  'solicitada',
  'confirmada',
  'en_curso',
  'completada',
  'cancelada',
  'inasistencia',
]);

export const crearCitaSchema = z.object({
  servicioIds: z
    .array(z.string().min(1, 'ID de servicio no válido'))
    .min(1, 'Debe seleccionar al menos un servicio'),
  inicio: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'La fecha y hora de inicio no es válida'),
  notas: z
    .string()
    .trim()
    .max(300, 'Las notas no pueden superar 300 caracteres')
    .optional(),
  clientaId: z.string().min(1).optional(),
  imagenReferenciaUrl: z.string().url('URL de imagen no válida').optional().or(z.literal('')),
});

export const cambiarEstadoCitaSchema = z.object({
  estado: estadoCitaSchema,
});

export type CrearCitaInput = z.infer<typeof crearCitaSchema>;
export type CambiarEstadoCitaInput = z.infer<typeof cambiarEstadoCitaSchema>;
