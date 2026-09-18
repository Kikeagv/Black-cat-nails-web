import { z } from 'zod';

export const rolSchema = z.enum(['admin', 'clienta']);

export const actualizarUsuariaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .optional(),
  telefono: z
    .string()
    .trim()
    .regex(/^\d{8}$/, 'El teléfono debe tener 8 dígitos numéricos')
    .optional(),
  notasPrivadas: z
    .string()
    .trim()
    .max(500, 'Las notas privadas no pueden exceder 500 caracteres')
    .optional(),
});

export const disponibilidadQuerySchema = z.object({
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato de fecha debe ser YYYY-MM-DD'),
  servicios: z
    .string()
    .min(1, 'Debe especificar al menos un ID de servicio'),
});

export type RolInput = z.infer<typeof rolSchema>;
export type ActualizarUsuariaInput = z.infer<typeof actualizarUsuariaSchema>;
export type DisponibilidadQueryInput = z.infer<typeof disponibilidadQuerySchema>;
