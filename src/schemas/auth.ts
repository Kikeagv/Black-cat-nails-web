import { z } from 'zod';

export const registroSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  correo: z
    .string()
    .trim()
    .email('Correo electrónico no válido'),
  telefono: z
    .string()
    .trim()
    .regex(/^\d{8}$/, 'El teléfono debe tener 8 dígitos numéricos'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const loginSchema = z.object({
  correo: z
    .string()
    .trim()
    .email('Correo electrónico no válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

export type RegistroInput = z.infer<typeof registroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
