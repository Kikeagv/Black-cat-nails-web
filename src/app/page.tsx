import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight, Plus, Sparkles, Clock, DollarSign } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-token)] px-4 py-12 md:px-8 max-w-5xl mx-auto space-y-12">
      {/* Encabezado */}
      <header className="flex flex-col items-center text-center space-y-4">
        <div className="relative size-28 drop-shadow-md">
          <Image
            src="/logo.svg"
            alt="Black Cat Nails Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div>
          <h1 className="text-display-32 tracking-tight text-white">
            Black Cat Nails
          </h1>
          <p className="text-body text-[var(--accent)] mt-1">
            BCN-02 · Verificación de Tema y Tokens de Diseño
          </p>
        </div>
      </header>

      {/* 1. Muestrario de Tokens de Color */}
      <section className="space-y-4">
        <h2 className="text-display-24 border-b border-white/10 pb-2">
          1. Paleta de Colores Oficial
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 rounded-[16px] bg-[#1A1209] border border-white/20 flex flex-col justify-between h-28">
            <span className="text-label text-white/70">--bg-base</span>
            <span className="font-mono text-xs font-bold text-white">#1A1209</span>
          </div>
          <div className="p-4 rounded-[16px] bg-[#B4476E] text-white flex flex-col justify-between h-28 shadow-lg">
            <span className="text-label text-white/80">--surface</span>
            <span className="font-mono text-xs font-bold">#B4476E</span>
          </div>
          <div className="p-4 rounded-[16px] bg-[#E070C4] text-white flex flex-col justify-between h-28 shadow-lg">
            <span className="text-label text-white/90">--primary</span>
            <span className="font-mono text-xs font-bold">#E070C4</span>
          </div>
          <div className="p-4 rounded-[16px] bg-[#9AA6E0] text-[#1A1209] flex flex-col justify-between h-28 shadow-lg">
            <span className="text-label text-[#1A1209]/80 font-medium">--accent</span>
            <span className="font-mono text-xs font-bold">#9AA6E0</span>
          </div>
          <div className="p-4 rounded-[16px] bg-[#FFFFFF] text-[#1A1209] flex flex-col justify-between h-28 shadow-lg">
            <span className="text-label text-black/70 font-medium">--text</span>
            <span className="font-mono text-xs font-bold">#FFFFFF</span>
          </div>
        </div>

        {/* Insignias de estado */}
        <div className="pt-2">
          <p className="text-label text-white/70 mb-2 font-medium">Insignias de Estado (05-ui-y-rutas.md):</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="solicitada">Solicitada</Badge>
            <Badge variant="confirmada">Confirmada</Badge>
            <Badge variant="en_curso">En curso</Badge>
            <Badge variant="completada">Completada</Badge>
            <Badge variant="cancelada">Cancelada</Badge>
            <Badge variant="inasistencia">Inasistencia</Badge>
            <Badge variant="stockOk">Insumo OK</Badge>
            <Badge variant="stockBajo">Insumo Bajo</Badge>
            <Badge variant="stockCritico">Insumo Crítico</Badge>
          </div>
        </div>
      </section>

      {/* 2. Escala Tipográfica y Espaciado */}
      <section className="space-y-4">
        <h2 className="text-display-24 border-b border-white/10 pb-2">
          2. Tipografía y Escalas (16px radio, 4/8/16/24/32px espaciado)
        </h2>
        <div className="bg-card p-6 rounded-[16px] border border-border/50 space-y-4">
          <div>
            <p className="text-label text-[var(--accent)]">Display 32 pt (Playfair Display Bold):</p>
            <p className="text-display-32">Hola, Camila</p>
          </div>
          <div>
            <p className="text-label text-[var(--accent)]">Display 24 pt (Playfair Display Bold):</p>
            <p className="text-display-24">Sáb 30 Ago · 14:00</p>
          </div>
          <div>
            <p className="text-label text-[var(--accent)]">Body 16 pt (Inter Regular):</p>
            <p className="text-body text-white/90">
              ¿Qué diseño creamos hoy? Seleccioná el servicio que más te guste para tu cita.
            </p>
          </div>
          <div>
            <p className="text-label text-[var(--accent)]">Label 13 pt (Inter Regular):</p>
            <p className="text-label text-white/60">
              Anticipación mínima de cancelación: 12 horas antes de la cita.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Componentes de Prueba Idénticos a Figma */}
      <section className="space-y-6">
        <h2 className="text-display-24 border-b border-white/10 pb-2">
          3. Componentes de Prueba (Fieles a Figma)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarjeta Destacada - Mockup Figma 5:52 */}
          <div className="space-y-2">
            <p className="text-label text-white/70 font-semibold">
              Tarjeta Destacada (Mockup Figma 5:52):
            </p>
            <Card
              variant="surface"
              className="p-5 flex flex-col justify-between min-h-[140px] shadow-lg rounded-[16px]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/90">
                  <Calendar className="size-4" />
                  <span>Tu próxima cita</span>
                </div>
                <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1 rounded-full transition-colors">
                  Ver detalle
                </button>
              </div>

              <div className="mt-4">
                <p className="text-display-24 text-white">Sáb 30 Ago · 14:00</p>
                <p className="text-sm text-white/90 mt-1">Uñas esculpidas + diseño</p>
              </div>
            </Card>
          </div>

          {/* Tarjeta Estándar de Catálogo - Mockup Figma 5:65 */}
          <div className="space-y-2">
            <p className="text-label text-white/70 font-semibold">
              Tarjeta de Catálogo (Mockup Figma 5:65):
            </p>
            <Card className="p-3.5 flex items-center justify-between gap-4 bg-card rounded-[16px] hover:border-[var(--accent)]/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="size-14 rounded-[12px] bg-[#2E2218] border border-white/10 flex items-center justify-center shrink-0 text-[var(--primary)]">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-[15px] text-white">Manicura clásica</h4>
                  <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> 45 min
                    </span>
                    <span>•</span>
                    <span className="text-[var(--primary)] font-semibold">$15.00</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="size-5 text-[var(--accent)] shrink-0" />
            </Card>
          </div>
        </div>

        {/* Botones fieles a Figma */}
        <div className="space-y-3 pt-2">
          <p className="text-label text-white/70 font-semibold">
            Botones de Acción (Figma h: 50px, radio: 16px):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button size="xl" className="w-full">
              Iniciar sesión
            </Button>
            <Button size="xl" variant="default" className="w-full gap-2">
              <Plus className="size-5" />
              Agendar cita
            </Button>
            <Button size="xl" variant="outline" className="w-full">
              Secundario
            </Button>
          </div>
        </div>

        {/* Input fiel a Figma */}
        <div className="space-y-2 max-w-md pt-2">
          <p className="text-label text-white/70 font-semibold">
            Input de Formulario (Figma h: 50px, radio: 16px, borde acento):
          </p>
          <Input placeholder="correo@ejemplo.com" defaultValue="camila@mail.com" />
        </div>
      </section>

      {/* Footer de verificación */}
      <footer className="pt-6 border-t border-white/10 text-center text-xs text-white/50">
        Black Cat Nails Web · Rúbrica DPS941 · BCN-02 completado exitosamente
      </footer>
    </main>
  );
}
