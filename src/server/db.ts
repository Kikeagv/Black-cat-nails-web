/**
 * REPOSITORIO EN MEMORIA — BLACK CAT NAILS WEB
 *
 * NOTA SOBRE PERSISTENCIA EN VERCEL / SERVERLESS:
 * Este módulo almacena todas las colecciones de la aplicación en la memoria del proceso
 * de Node.js, precargándolas a partir de `src/data/seed.json`.
 *
 * En entornos serverless como Vercel, las instancias de ejecución son efímeras y se
 * destruyen o reinician ante inactividad, reciclaje de contenedores o nuevos despliegues.
 * En consecuencia, cualquier mutación en los datos (nuevas usuarias, citas creadas, cambios
 * de estado o actualización de existencias de insumos) se perderá al reiniciar la función,
 * restaurándose el estado original de `seed.json`.
 *
 * Esta es una limitación conocida, aceptada y documentada para la Etapa 2 de la asignatura
 * DPS941. En la Etapa 3, este repositorio en memoria se sustituirá por Google Cloud
 * Firestore sin requerir modificaciones en las capas superiores.
 */

import seedDataRaw from '@/data/seed.json';
import {
  Cita,
  EstadoCita,
  Insumo,
  Rol,
  SeedData,
  Servicio,
  UsuariaConHash,
} from '@/types';

interface FiltroCitas {
  desde?: string;
  hasta?: string;
  estado?: EstadoCita | EstadoCita[];
  clientaId?: string;
}

interface FiltroServicios {
  activo?: boolean;
}

interface FiltroUsuarias {
  rol?: Rol;
}

class InMemoryDatabase {
  private usuarias: UsuariaConHash[];
  private servicios: Servicio[];
  private insumos: Insumo[];
  private citas: Cita[];

  constructor() {
    const seed = seedDataRaw as SeedData;
    this.usuarias = structuredClone(seed.usuarias);
    this.servicios = structuredClone(seed.servicios);
    this.insumos = structuredClone(seed.insumos);
    this.citas = structuredClone(seed.citas);
  }

  public reset(): void {
    const seed = seedDataRaw as SeedData;
    this.usuarias = structuredClone(seed.usuarias);
    this.servicios = structuredClone(seed.servicios);
    this.insumos = structuredClone(seed.insumos);
    this.citas = structuredClone(seed.citas);
  }

  public readonly usuariasRepo = {
    list: (filtro?: FiltroUsuarias): UsuariaConHash[] => {
      let resultado = this.usuarias;
      if (filtro?.rol) {
        resultado = resultado.filter((u) => u.rol === filtro.rol);
      }
      return structuredClone(resultado);
    },

    findById: (id: string): UsuariaConHash | undefined => {
      const usuaria = this.usuarias.find((u) => u.id === id);
      return usuaria ? structuredClone(usuaria) : undefined;
    },

    findByCorreo: (correo: string): UsuariaConHash | undefined => {
      const correoNormalizado = correo.trim().toLowerCase();
      const usuaria = this.usuarias.find(
        (u) => u.correo.trim().toLowerCase() === correoNormalizado
      );
      return usuaria ? structuredClone(usuaria) : undefined;
    },

    create: (
      datos: Omit<UsuariaConHash, 'id' | 'creadaEn'> & {
        id?: string;
        creadaEn?: string;
      }
    ): UsuariaConHash => {
      const nueva: UsuariaConHash = {
        ...datos,
        id: datos.id || crypto.randomUUID(),
        creadaEn: datos.creadaEn || new Date().toISOString(),
      };
      this.usuarias.push(nueva);
      return structuredClone(nueva);
    },

    update: (
      id: string,
      datos: Partial<Omit<UsuariaConHash, 'id'>>
    ): UsuariaConHash | undefined => {
      const index = this.usuarias.findIndex((u) => u.id === id);
      if (index === -1) return undefined;
      this.usuarias[index] = {
        ...this.usuarias[index],
        ...datos,
      };
      return structuredClone(this.usuarias[index]);
    },
  };

  public readonly serviciosRepo = {
    list: (filtro?: FiltroServicios): Servicio[] => {
      let resultado = this.servicios;
      if (filtro?.activo !== undefined) {
        resultado = resultado.filter((s) => s.activo === filtro.activo);
      }
      return structuredClone(resultado);
    },

    findById: (id: string): Servicio | undefined => {
      const servicio = this.servicios.find((s) => s.id === id);
      return servicio ? structuredClone(servicio) : undefined;
    },

    findByNombre: (nombre: string): Servicio | undefined => {
      const nombreNormalizado = nombre.trim().toLowerCase();
      const servicio = this.servicios.find(
        (s) => s.nombre.trim().toLowerCase() === nombreNormalizado
      );
      return servicio ? structuredClone(servicio) : undefined;
    },

    create: (datos: Omit<Servicio, 'id'> & { id?: string }): Servicio => {
      const nuevo: Servicio = {
        ...datos,
        id: datos.id || crypto.randomUUID(),
      };
      this.servicios.push(nuevo);
      return structuredClone(nuevo);
    },

    update: (
      id: string,
      datos: Partial<Omit<Servicio, 'id'>>
    ): Servicio | undefined => {
      const index = this.servicios.findIndex((s) => s.id === id);
      if (index === -1) return undefined;
      this.servicios[index] = {
        ...this.servicios[index],
        ...datos,
      };
      return structuredClone(this.servicios[index]);
    },
  };

  public readonly citasRepo = {
    list: (filtro?: FiltroCitas): Cita[] => {
      let resultado = this.citas;

      if (filtro?.clientaId) {
        resultado = resultado.filter((c) => c.clientaId === filtro.clientaId);
      }

      if (filtro?.estado) {
        if (Array.isArray(filtro.estado)) {
          resultado = resultado.filter((c) =>
            (filtro.estado as EstadoCita[]).includes(c.estado)
          );
        } else {
          resultado = resultado.filter((c) => c.estado === filtro.estado);
        }
      }

      if (filtro?.desde) {
        resultado = resultado.filter((c) => c.inicio >= filtro.desde!);
      }

      if (filtro?.hasta) {
        resultado = resultado.filter((c) => c.inicio <= filtro.hasta!);
      }

      return structuredClone(resultado);
    },

    findById: (id: string): Cita | undefined => {
      const cita = this.citas.find((c) => c.id === id);
      return cita ? structuredClone(cita) : undefined;
    },

    create: (
      datos: Omit<Cita, 'id' | 'creadaEn'> & { id?: string; creadaEn?: string }
    ): Cita => {
      const nueva: Cita = {
        ...datos,
        id: datos.id || crypto.randomUUID(),
        creadaEn: datos.creadaEn || new Date().toISOString(),
      };
      this.citas.push(nueva);
      return structuredClone(nueva);
    },

    update: (
      id: string,
      datos: Partial<Omit<Cita, 'id'>>
    ): Cita | undefined => {
      const index = this.citas.findIndex((c) => c.id === id);
      if (index === -1) return undefined;
      this.citas[index] = {
        ...this.citas[index],
        ...datos,
      };
      return structuredClone(this.citas[index]);
    },
  };

  public readonly insumosRepo = {
    list: (): Insumo[] => {
      return structuredClone(this.insumos);
    },

    findById: (id: string): Insumo | undefined => {
      const insumo = this.insumos.find((i) => i.id === id);
      return insumo ? structuredClone(insumo) : undefined;
    },

    create: (datos: Omit<Insumo, 'id'> & { id?: string }): Insumo => {
      const nuevo: Insumo = {
        ...datos,
        id: datos.id || crypto.randomUUID(),
      };
      this.insumos.push(nuevo);
      return structuredClone(nuevo);
    },

    update: (
      id: string,
      datos: Partial<Omit<Insumo, 'id'>>
    ): Insumo | undefined => {
      const index = this.insumos.findIndex((i) => i.id === id);
      if (index === -1) return undefined;
      this.insumos[index] = {
        ...this.insumos[index],
        ...datos,
      };
      return structuredClone(this.insumos[index]);
    },
  };
}

// Conserva la misma instancia en memoria entre invocaciones y durante Hot Module Reloading (HMR)
const globalForDb = globalThis as unknown as {
  __bcn_in_memory_db__?: InMemoryDatabase;
};

export const database =
  globalForDb.__bcn_in_memory_db__ ?? new InMemoryDatabase();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__bcn_in_memory_db__ = database;
}

export const db = {
  usuarias: database.usuariasRepo,
  servicios: database.serviciosRepo,
  citas: database.citasRepo,
  insumos: database.insumosRepo,
  reset: () => database.reset(),
};

export default db;
