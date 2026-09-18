export type Rol = 'admin' | 'clienta';

export type EstadoCita =
  | 'solicitada'
  | 'confirmada'
  | 'en_curso'
  | 'completada'
  | 'cancelada'
  | 'inasistencia';

export interface Usuaria {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  rol: Rol;
  inasistencias: number;      // contador precalculado
  notasPrivadas?: string;     // solo visible para la admin
  creadaEn: string;           // ISO
}

/** Nunca sale del servidor. */
export interface UsuariaConHash extends Usuaria {
  passwordHash: string;
}

export interface ConsumoInsumo {
  insumoId: string;
  cantidad: number;
}

export interface Servicio {
  id: string;
  nombre: string;
  categoria: string;          // 'Manicura' | 'Pedicura' | 'Nail art' | 'Acrílico' | 'Gel'
  precio: number;             // USD
  duracionMin: number;        // múltiplo de 5, entre 10 y 240
  cicloRetornoDias: number;   // 0 o entre 7 y 90
  activo: boolean;
  imagenUrl?: string;
  consumos: ConsumoInsumo[];
}

/** Copia congelada dentro de la cita. */
export interface ServicioEnCita {
  servicioId: string;
  nombre: string;
  precio: number;
  duracionMin: number;
}

export interface Cita {
  id: string;
  clientaId: string;
  servicios: ServicioEnCita[];
  inicio: string;             // ISO con zona
  fin: string;                // ISO con zona
  duracionTotalMin: number;   // incluye preparación
  montoTotal: number;
  estado: EstadoCita;
  notas?: string;
  imagenReferenciaUrl?: string;
  insumosDescontados?: ConsumoInsumo[];  // se llena al completar
  montoCobrado?: number;                 // se llena al completar
  fechaRetoque?: string;                 // se calcula al completar
  creadaEn: string;
}

export interface Insumo {
  id: string;
  nombre: string;
  unidad: string;             // 'ml' | 'g' | 'unidad'
  existencia: number;
  minimo: number;
  costo: number;              // USD por unidad
  estado?: EstadoInsumo;
}

export type EstadoInsumo = 'ok' | 'bajo' | 'critico';

export interface Intervalo {
  inicio: string;             // ISO con zona o HH:mm
  fin: string;                // ISO con zona o HH:mm
}

export interface HorarioDisponible {
  hora: string;               // 'HH:mm'
  disponible: boolean;
}

export interface RespuestaDisponibilidad {
  fecha: string;              // 'YYYY-MM-DD'
  duracionTotalMin: number;
  horarios: HorarioDisponible[];
}

export interface IndicadoresDashboard {
  citasHoy: number;
  ingresosMes: number;
  clientasActivas: number;
  tasaInasistencia: number;
}

export interface CitaAgendaHoy {
  id: string;
  hora: string;
  clienta: string;
  servicios: string;
  estado: EstadoCita;
}

export interface AlertaDashboard {
  tipo: 'insumo_bajo' | 'cita_sin_confirmar' | 'retoque_pendiente';
  mensaje: string;
  severidad: 'bajo' | 'medio' | 'critico';
}

export interface IngresoSemanal {
  semana: string;
  ingresos: number;
}

export interface DashboardData {
  indicadores: IndicadoresDashboard;
  agendaHoy: CitaAgendaHoy[];
  alertas: AlertaDashboard[];
  ingresosPorSemana: IngresoSemanal[];
}

export interface SeedData {
  usuarias: UsuariaConHash[];
  servicios: Servicio[];
  insumos: Insumo[];
  citas: Cita[];
}
