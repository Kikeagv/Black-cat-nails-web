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

## Funcionalidades

- **Autenticación (RF-01)**: Registro e inicio de sesión para clientas, sesión JWT y autorización por roles (`clienta` y `admin`). El registro público siempre asigna el rol `clienta`.
- **Portal de la clienta (RF-02, RF-03, RF-05)**:
  - Catálogo filtrable por categoría y próxima cita destacada (`/app`).
  - Agendamiento en tres pasos. La disponibilidad se consulta en vivo y se vuelve a validar en el servidor al crear la cita (`/app/agendar`).
  - Próximas citas e historial. La cita queda confirmada al crearse; la clienta puede cancelarla con al menos 12 horas de anticipación (`/app/citas`).
- **Dashboard administrativo (RF-04)**: Indicadores, ingresos semanales, agenda del día y alertas operativas (`/admin`).
- **Agenda (RF-03, RF-05)**: Vista semanal, detalle y cambio de estado de las citas, además de creación manual por parte de la administradora (`/admin/agenda`).
- **Servicios (RF-02)**: Crear y editar servicios, gestionar su disponibilidad, precio, duración, ciclo de retorno y consumo de insumos (`/admin/servicios`).
- **Inventario (RF-06)**: Existencias comparadas con el mínimo requerido, nivel de criticidad, rendimiento estimado por insumo y registro de compras (`/admin/inventario`).
- **Clientas (RF-07)**: Búsqueda y filtros por actividad e inasistencias, ficha con historial y métricas, alerta a partir de dos inasistencias y notas privadas editables (`/admin/clientas`).
- **Estados de interfaz y UX**: Indicadores de carga, estados vacíos, mensajes de error y acciones para reintentar en las pantallas que consultan datos. El cliente HTTP informa cuando detecta falta de conexión. La interfaz es adaptable a móvil, tableta y escritorio.

## Arquitectura y autenticación

La aplicación está organizada alrededor de Next.js App Router:

- `src/app` contiene las páginas de clientas, administración y acceso público.
- `src/app/api` contiene los Route Handlers del API.
- `src/services` centraliza las llamadas HTTP desde el cliente.
- `src/context` comparte el estado de autenticación, agenda, catálogo e inventario.
- `src/domain` contiene reglas de negocio y cálculos; `src/schemas` define validaciones Zod.
- `src/server` contiene la sesión y los repositorios de datos del servidor.

### Registro

1. El formulario usa React Hook Form y `zodResolver`; valida nombre (mínimo 3 caracteres), correo, teléfono de 8 dígitos y contraseña (mínimo 8 caracteres).
2. Envía `POST /api/auth/registro`. El servidor vuelve a validar el cuerpo con Zod, normaliza el correo y rechaza correos duplicados.
3. `bcryptjs` guarda un hash de la contraseña usando 10 rondas. La cuenta recibe rol `clienta` e inicia con cero inasistencias.
4. El servidor firma un JWT y crea la cookie de sesión. La respuesta excluye `passwordHash`.

### Inicio, persistencia de sesión y permisos

- `POST /api/auth/login` valida el formato, busca la cuenta y compara la contraseña con el hash. Los errores de credenciales usan un mensaje genérico.
- `jose` firma tokens HS256 con el ID de usuaria en `sub` y el rol en el payload. Expiran en 8 horas y requieren `SESSION_SECRET`.
- El token viaja en la cookie `bcn_session`, configurada como `HttpOnly`, `SameSite=Lax`, `Path=/` y `Secure` en producción. El endpoint `GET /api/auth/me` permite rehidratar la sesión; `POST /api/auth/logout` elimina la cookie.
- `src/proxy.ts` protege las páginas `/admin/*` y `/app/*` según el rol. Los endpoints protegidos también verifican sesión y rol en el servidor.

## API principal

| Área | Rutas principales | Uso |
| --- | --- | --- |
| Autenticación | `POST /api/auth/registro`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` | Crear cuenta, iniciar, consultar y cerrar sesión |
| Citas | `GET/POST /api/citas`, `PATCH /api/citas/[id]/estado` | Consultar, crear y cambiar el estado de las citas |
| Disponibilidad | `GET /api/disponibilidad` | Calcular horarios disponibles para una fecha y servicios |
| Catálogo | `/api/servicios` y `/api/servicios/[id]` | Consultar y gestionar servicios |
| Operación | `/api/insumos`, `/api/clientas`, `/api/dashboard` | Inventario, directorio de clientas e indicadores administrativos |

---

## Cómo Ejecutar el Proyecto

### Prerrequisitos

- **Node.js**: v20.9.0 o superior (requisito de Next.js 16)
- **npm**: v10 o superior

### Instalación y Ejecución

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Kikeagv/Black-cat-nails-web.git
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
   Genera un secreto aleatorio con Node.js:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copia el resultado a `SESSION_SECRET` en `.env.local`. En producción, configura la misma variable en el entorno de despliegue. No subas `.env.local` al repositorio.

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

### Credenciales de Prueba (Seed)

Estas cuentas de demostración se cargan desde `src/data/seed.json`:

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

- **Framework**: Next.js 16.3.5 (App Router, Route Handlers, Proxy, Turbopack)
- **UI**: React 19, Tailwind CSS v4, Base UI y componentes reutilizables con patrones de shadcn/ui
- **Lenguaje**: TypeScript (Strict Mode)
- **Formularios y validación**: React Hook Form y Zod
- **Sesión y seguridad**: `jose` para JWT y `bcryptjs` para hash de contraseñas
- **Gráficas y utilidades**: Recharts, date-fns, lucide-react y Sonner

## Persistencia: limitación de esta etapa

Los repositorios de `src/server/db.ts` cargan y clonan `src/data/seed.json` en memoria. No hay una base de datos persistente conectada todavía. En Vercel, cada instancia serverless mantiene su propia memoria y puede reiniciarse; por eso, los cambios hechos durante el uso no son persistentes y el estado vuelve al seed cuando el proceso se reinicia o se despliega una versión nueva. La migración a Cloud Firestore está prevista para la Etapa 3.
