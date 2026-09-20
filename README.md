# Black Cat Nails Web — Etapa 2

Sistema web para el salón de manicura y estética **Black Cat Nails by Vante**, desarrollado como proyecto de cátedra para la asignatura **DPS941 (Diseño y Programación de Software Multiplataforma)** en la **Universidad Don Bosco**.

---

## Integrantes

- **Enrique Alejandro García Villeda**

---

## Enlace del Despliegue

- **URL de Producción**: [https://black-cat-nails-web.vercel.app](https://black-cat-nails-web.vercel.app)
- **Repositorio en GitHub**: [Kikeagv/Black-cat-nails-web](https://github.com/Kikeagv/Black-cat-nails-web)

---

## Features del Proyecto

- **Autenticación y Seguridad (RF-01)**: Registro e inicio de sesión con JWT en cookie `httpOnly`, validaciones Zod, contraseñas con `bcryptjs` y control de acceso por roles (`clienta` y `admin`).
- **Portal de la Clienta (RF-02, RF-03, RF-05)**:
  - Próxima cita destacada y catálogo interactivo de servicios con filtros por categoría (`/app`).
  - Flujo de agendamiento en 3 pasos con cálculo de disponibilidad horaria en vivo (`/app/agendar`).
  - Mis Citas: reservas confirmadas al crearse, con visualización de próximas citas e historial y cancelación sujeta a 12 horas de anticipación (`/app/citas`).
- **Dashboard Administrativo (RF-04)**: Tarjetas KPI, gráfica de ingresos semanales con Recharts, agenda del día y panel de alertas operativas (`/admin`).
- **Agenda Semanal (RF-03, RF-05)**: Vista semanal interactiva de 7 columnas, detalle de cita con cambio de estados y modal de nueva cita manual (`/admin/agenda`).
- **Gestión de Servicios (RF-02)**: CRUD completo de servicios con duración, precio, ciclo de retorno y consumos de insumos (`/admin/servicios`).
- **Inventario e Insumos (RF-06)**: Control de existencias contra mínimo de seguridad, barra de progreso con semáforo de criticidad, rendimiento en clientas atendibles y registro de compras (`/admin/inventario`).
- **Directorio de Clientas (RF-07)**: Búsqueda en vivo, filtros (todas, activas 60d, con inasistencias), alerta visual de ausentismo ($\ge 2$ inasistencias) y ficha modal con historial y notas privadas editables (`/admin/clientas`).
- **Diseño, Resiliencia y UX**: Esqueletos de carga según la forma del contenido, estados vacíos con acciones claras, manejo de errores con reintento, diseño adaptable a 360 px, 768 px y 1440 px, y resiliencia ante desconexión de red.

---

## Cómo Ejecutar el Proyecto

### Prerrequisitos

- **Node.js**: v20 o superior
- **npm**: v10 o superior

### Instalación y Ejecución

1. **Clonar el repositorio:**
   ```bash
   git clone git@github.com:Kikeagv/Black-cat-nails-web.git
   cd Black-cat-nails-web
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env.local
   ```

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

### Credenciales de Prueba (Seed)

| Rol | Correo | Contraseña |
| --- | --- | --- |
| **Administradora** | `vante@blackcatnails.sv` | `Password123` |
| **Clienta** | `camila@mail.com` | `Password123` |

### Scripts Útiles

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Construcción para producción
npm run lint       # Linter de código (ESLint)
npx tsc --noEmit   # Verificación estricta de tipos de TypeScript
```

---

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Lenguaje**: TypeScript (Strict Mode)
- **Estilos**: Tailwind CSS v4 + componentes accesibles tipo shadcn/ui
- **Validación y Utilidades**: Zod, date-fns, lucide-react, sonner
- **Persistencia**: Repositorio en memoria inicializado con `seed.json` (diseñado para migración a Cloud Firestore en Etapa 3)
