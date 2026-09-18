'use client';

import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';

export default function PerfilPage() {
  const { usuaria, logout } = useAuth();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-display-32 font-serif text-white">Mi Perfil</h1>
        <p className="text-sm text-[var(--accent)]">
          Información de la cuenta
        </p>
      </div>

      <Card className="p-6 rounded-[16px] border border-white/10 bg-card/60 backdrop-blur space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-full bg-[var(--primary)]/20 border border-[var(--primary)]/40 flex items-center justify-center text-[var(--primary)]">
            <User className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{usuaria?.nombre}</h2>
            <p className="text-xs text-white/60">{usuaria?.correo}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm">
          <div className="p-3 rounded-[12px] bg-black/20 border border-white/5">
            <span className="text-xs text-white/50 block">Teléfono:</span>
            <span className="font-medium text-white">{usuaria?.telefono}</span>
          </div>
          <div className="p-3 rounded-[12px] bg-black/20 border border-white/5">
            <span className="text-xs text-white/50 block">Tipo de cuenta:</span>
            <span className="font-medium text-[var(--primary)] capitalize">{usuaria?.rol}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <Button
            variant="outline"
            onClick={() => logout()}
            className="w-full gap-2 text-red-400 hover:text-red-300 hover:bg-red-950/20 border-red-900/30"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </div>
      </Card>
    </div>
  );
}
