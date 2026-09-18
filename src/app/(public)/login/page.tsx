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
import { loginSchema, LoginInput } from '@/schemas/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/services/http';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');

  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      correo: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setGeneralError(null);
    try {
      const usuaria = await login(data);
      toast.success(`¡Bienvenida de nuevo, ${usuaria.nombre}!`);

      if (nextParam && nextParam.startsWith('/')) {
        router.push(nextParam);
      } else if (usuaria.rol === 'admin') {
        router.push('/admin');
      } else {
        router.push('/app');
      }
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setGeneralError(error.message);
      } else if (error instanceof Error) {
        setGeneralError(error.message);
      } else {
        setGeneralError('Ocurrió un error inesperado al iniciar sesión');
      }
    }
  };

  const registroHref = nextParam
    ? `/registro?next=${encodeURIComponent(nextParam)}`
    : '/registro';

  return (
    <div className="w-full max-w-[390px] mx-auto bg-card/60 backdrop-blur border border-white/10 rounded-[32px] p-8 sm:p-10 shadow-2xl flex flex-col justify-between">
      {/* Header con logotipo y tipografía según Figma (Figura 1 / 2:26) */}
      <div className="flex flex-col items-center gap-3 text-center mb-8">
        <div className="relative size-28 drop-shadow-md">
          <Image
            src="/logo.svg"
            alt="Black Cat Nails Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-display-32 text-white font-serif tracking-tight">
          Black Cat Nails
        </h1>
      </div>

      {/* Error general */}
      {generalError && (
        <div
          role="alert"
          className="mb-6 p-3 rounded-[16px] bg-red-950/50 border border-red-500/40 text-red-200 text-xs text-center font-medium"
        >
          {generalError}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Correo */}
        <div className="space-y-1.5">
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

        {/* Contraseña */}
        <div className="space-y-1.5">
          <Input
            id="password"
            type="password"
            placeholder="••••••••••••"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-[#ff4444] text-xs px-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Botón de acción */}
        <div className="pt-4">
          <Button
            type="submit"
            size="xl"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-5 animate-spin" />
                Cargando...
              </span>
            ) : (
              'Iniciar sesión'
            )}
          </Button>
        </div>
      </form>

      {/* Enlace a registro */}
      <div className="mt-8 text-center text-sm text-white/60 flex items-center justify-center gap-1.5">
        <span>¿No tenés cuenta?</span>
        <Link
          href={registroHref}
          className="font-semibold text-[var(--accent)] hover:underline"
        >
          Registrate
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white/60 text-sm">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
