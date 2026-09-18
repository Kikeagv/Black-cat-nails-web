'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ClientaAppPage() {
  const { usuaria } = useAuth();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-display-32 font-serif text-white">
          ¡Hola, {usuaria?.nombre?.split(' ')[0] || 'Clienta'}!
        </h1>
        <p className="text-sm text-[var(--accent)]">
          ¿Qué diseño creamos hoy?
        </p>
      </div>

      {/* Acceso rápido a agendar */}
      <Card variant="surface" className="p-5 rounded-[16px] space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/90">
          <Calendar className="size-4" />
          <span>Autogestión de citas</span>
        </div>
        <p className="text-sm text-white/90">
          Agendá tu cita en 3 simples pasos con cálculo automático de disponibilidad horaria.
        </p>
        <Link href="/app/agendar" className="block pt-2">
          <Button size="xl" className="w-full gap-2">
            <Plus className="size-5" />
            Agendar nueva cita
          </Button>
        </Link>
      </Card>
    </div>
  );
}
