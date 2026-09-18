'use client';

import React, { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { registroSchema, RegistroInput } from '@/schemas/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/services/http';

function RegistroForm() {
  const { registrar } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');

  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistroInput>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombre: '',
      correo: '',
      telefono: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegistroInput) => {
    setGeneralError(null);
    try {
      const usuaria = await registrar(data);
      toast.success(`¡Cuenta creada con éxito! Bienvenida, ${usuaria.nombre}.`);

      if (nextParam && nextParam.startsWith('/')) {
        router.push(nextParam);
      } else {
        router.push('/app');
      }
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (error.campos) {
          Object.entries(error.campos).forEach(([campo, mensaje]) => {
            setError(campo as keyof RegistroInput, { message: mensaje });
          });
        }
        if (error.code === 'correo_duplicado') {
          setError('correo', { message: error.message });
        } else {
          setGeneralError(error.message);
        }
      } else if (error instanceof Error) {
        setGeneralError(error.message);
      } else {
        setGeneralError('Ocurrió un error inesperado al registrar la cuenta');
      }
    }
  };

  const loginHref = nextParam
    ? `/login?next=${encodeURIComponent(nextParam)}`
    : '/login';

  return (
    <div className="w-full max-w-[420px] mx-auto bg-card/60 backdrop-blur border border-white/10 rounded-[32px] p-8 sm:p-10 shadow-2xl flex flex-col justify-between">
      {/* Header con logotipo y tipografía según Figma */}
      <div className="flex flex-col items-center gap-3 text-center mb-6">
        <div className="relative size-24 drop-shadow-md">
          <Image
            src="/logo.svg"
            alt="Black Cat Nails Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div>
          <h1 className="text-display-32 text-white font-serif tracking-tight">
            Crear cuenta
          </h1>
          <p className="text-xs text-white/60 mt-1">
            Black Cat Nails by Vante
          </p>
        </div>
      </div>

      {/* Error general */}
      {generalError && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-[16px] bg-red-950/50 border border-red-500/40 text-red-200 text-xs text-center font-medium"
        >
          {generalError}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
        {/* Nombre completo */}
        <div className="space-y-1">
          <label htmlFor="nombre" className="text-label text-white/70 text-xs px-1">
            Nombre completo
          </label>
          <Input
            id="nombre"
            type="text"
            placeholder="Camila Pérez"
            autoComplete="name"
            aria-invalid={!!errors.nombre}
            {...register('nombre')}
          />
          {errors.nombre && (
            <p className="text-[#ff4444] text-xs px-1">
              {errors.nombre.message}
            </p>
          )}
        </div>

        {/* Correo electrónico */}
        <div className="space-y-1">
          <label htmlFor="correo" className="text-label text-white/70 text-xs px-1">
            Correo electrónico
          </label>
          <Input
            id="correo"
            type="email"
            placeholder="correo@ejemplo.com"
            autoComplete="email"
            aria-invalid={!!errors.correo}
            {...register('correo')}
          />
          {errors.correo && (
            <p className="text-[#ff4444] text-xs px-1">
              {errors.correo.message}
            </p>
          )}
        </div>

        {/* Teléfono */}
        <div className="space-y-1">
          <label htmlFor="telefono" className="text-label text-white/70 text-xs px-1">
            Teléfono (8 dígitos)
          </label>
          <Input
            id="telefono"
            type="tel"
            placeholder="70001234"
            autoComplete="tel"
            maxLength={8}
            aria-invalid={!!errors.telefono}
            {...register('telefono')}
          />
          {errors.telefono && (
            <p className="text-[#ff4444] text-xs px-1">
              {errors.telefono.message}
            </p>
          )}
        </div>

        {/* Contraseña */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-label text-white/70 text-xs px-1">
            Contraseña (mínimo 8 caracteres)
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••••••"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-[#ff4444] text-xs px-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Botón de envío */}
        <div className="pt-3">
          <Button
            type="submit"
            size="xl"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-5 animate-spin" />
                Registrando...
              </span>
            ) : (
              'Registrarme'
            )}
          </Button>
        </div>
      </form>

      {/* Enlace a login */}
      <div className="mt-6 text-center text-sm text-white/60 flex items-center justify-center gap-1.5">
        <span>¿Ya tenés cuenta?</span>
        <Link
          href={loginHref}
          className="font-semibold text-[var(--accent)] hover:underline"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white/60 text-sm">Cargando...</div>}>
        <RegistroForm />
      </Suspense>
    </main>
  );
}
