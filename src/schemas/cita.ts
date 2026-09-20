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
});

export const cambiarEstadoCitaSchema = z.object({
  estado: estadoCitaSchema,
});

export const consultaDisponibilidadSchema = z.object({
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD')
    .refine((val) => !isNaN(Date.parse(val)), 'Fecha no válida'),
  servicios: z
    .string()
    .min(1, 'Debe especificar al menos un ID de servicio'),
});

export type CrearCitaInput = z.infer<typeof crearCitaSchema>;
export type CambiarEstadoCitaInput = z.infer<typeof cambiarEstadoCitaSchema>;
export type ConsultaDisponibilidadInput = z.infer<typeof consultaDisponibilidadSchema>;
