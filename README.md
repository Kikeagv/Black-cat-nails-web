# Black Cat Nails Web — Etapa 2

Sistema web para el salón de manicura y estética **Black Cat Nails by Vante**, desarrollado como proyecto de cátedra para la asignatura **DPS941 (Diseño y Programación de Software Multiplataforma)** en la **Universidad Don Bosco**.

## Enlace del despliegue (Vercel)

- **URL de Producción**: `https://black-cat-nails-web.vercel.app` (o la URL asignada a tu proyecto en Vercel)
- Conectado automáticamente al repositorio de GitHub: [`Kikeagv/Black-cat-nails-web`](https://github.com/Kikeagv/Black-cat-nails-web) con despliegues automáticos ante cada push a `main`.

---

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router, React 19, Server Components)
- **Lenguaje**: TypeScript en modo estricto
- **Estilos**: Tailwind CSS v4 + componentes basados en shadcn/ui
- **Validación**: Zod (esquemas compartidos entre cliente y servidor)
- **Comunicación**: API REST (Route Handlers en `/api/*` consumidos exclusivamente vía `src/services/http.ts`)
- **Autenticación**: Sesión en servidor con cookie `httpOnly`, token JWT firmado con `jose` y contraseñas con `bcryptjs`
- **Persistencia**: Repositorio en memoria (`src/server/db.ts`) inicializado con datos semilla (`src/data/seed.json`)

---

## Variables de Entorno

El proyecto incluye el archivo `.env.example` como plantilla. En desarrollo local o en el panel de Vercel se deben configurar las siguientes variables:

```bash
SESSION_SECRET=55f2899aad40c4a7c460e71ee38b177f3872a44064c7e5c1dfe165edd253ca7e
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

> **Importante**: Nunca subas archivos `.env` o `.env.local` al repositorio. `.gitignore` está configurado para excluir todas las variantes de `.env*` salvo `.env.example`.

---

## Nota sobre Persistencia y Entorno Serverless (Vercel)

El módulo `src/server/db.ts` gestiona los datos de la aplicación en memoria del proceso a partir de `src/data/seed.json`.

En entornos de ejecución serverless como Vercel, las instancias de ejecución (lambdas) son efímeras y se destruyen o reinician ante inactividad o nuevos despliegues. Cualquier mutación efectuada durante la ejecución (creación de citas, registros, cambios de estado o insumos) persistirá únicamente durante el ciclo de vida de la instancia activa en caliente y se restaurará al estado inicial de `seed.json` tras el reciclado de la función.

Esta es una **limitación arquitectónica conocida y aceptada para la Etapa 2**. En la Etapa 3 del proyecto, este repositorio en memoria y los servicios correspondientes serán sustituidos por **Google Cloud Firestore**.

---

## Scripts Disponibles

```bash
npm run dev        # Inicia el servidor de desarrollo
npm run build      # Construye la aplicación optimizada para producción
npx tsc --noEmit   # Verificación estricta de tipos de TypeScript
npm run lint       # Ejecuta ESLint
```
