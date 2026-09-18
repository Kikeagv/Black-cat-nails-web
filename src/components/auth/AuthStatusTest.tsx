'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { LogIn, LogOut, RefreshCw, UserCheck, UserX } from 'lucide-react';

export function AuthStatusTest() {
  const { usuaria, cargando, login, logout, refrescarSesion } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [accionando, setAccionando] = useState(false);

  const handleLoginPrueba = async (rol: 'admin' | 'clienta') => {
    setErrorMsg(null);
    setAccionando(true);
    try {
      if (rol === 'admin') {
        await login({
          correo: 'vante@blackcatnails.sv',
          password: 'Password123',
        });
      } else {
        await login({
          correo: 'camila@mail.com',
          password: 'Password123',
        });
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setAccionando(false);
    }
  };

  const handleLogout = async () => {
    setErrorMsg(null);
    setAccionando(true);
    try {
      await logout();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cerrar sesión');
    } finally {
      setAccionando(false);
    }
  };

  return (
    <section className="space-y-4 pt-4 border-t border-white/10" data-testid="auth-section">
      <h2 className="text-display-24 border-b border-white/10 pb-2 flex items-center justify-between">
        <span>Estado Global de Autenticación (BCN-09 · useAuth)</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refrescarSesion()}
          disabled={cargando || accionando}
          className="gap-1 text-xs"
        >
          <RefreshCw className={`size-3 ${cargando ? 'animate-spin' : ''}`} />
          Refrescar sesión
        </Button>
      </h2>

      <Card className="p-5 bg-card/60 backdrop-blur rounded-[16px] border border-white/10 space-y-4">
        {cargando ? (
          <div className="flex items-center gap-3 py-4 text-white/70" data-testid="auth-loading">
            <div className="size-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Rehidratando sesión con /api/auth/me...</span>
          </div>
        ) : usuaria ? (
          <div className="space-y-3" data-testid="auth-authenticated">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="size-5 text-[var(--primary)]" />
                <span className="font-semibold text-white">{usuaria.nombre}</span>
                <span className="text-xs text-white/50">({usuaria.correo})</span>
              </div>
              <Badge variant={usuaria.rol === 'admin' ? 'confirmada' : 'solicitada'}>
                Rol: {usuaria.rol}
              </Badge>
            </div>

            <div className="text-xs text-white/60">
              ID: <span className="font-mono">{usuaria.id}</span> · Teléfono: {usuaria.telefono}
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={accionando}
                className="gap-2 text-xs"
              >
                <LogOut className="size-3.5" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3" data-testid="auth-unauthenticated">
            <div className="flex items-center gap-2 text-white/70">
              <UserX className="size-5 text-white/40" />
              <span className="text-sm">Sin sesión activa (Visitante público)</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => handleLoginPrueba('admin')}
                disabled={accionando}
                className="gap-2 text-xs"
              >
                <LogIn className="size-3.5" />
                Iniciar sesión Admin (Valeria Vante)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleLoginPrueba('clienta')}
                disabled={accionando}
                className="gap-2 text-xs"
              >
                <LogIn className="size-3.5" />
                Iniciar sesión Clienta (Camila Pérez)
              </Button>
            </div>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-900/50">
            {errorMsg}
          </p>
        )}
      </Card>
    </section>
  );
}
