# LINC Inventario

Sistema web para gestionar el inventario del laboratorio LINC: ver lo que hay actualmente, registrar
entradas, corregir cantidades con trazabilidad e importar/exportar Excel.

## Funcionalidades

- **Inventario actual**: búsqueda por código o nombre, filtros por ubicación y stock, orden y paginación.
  Indicadores: ítems, unidades totales, ítems sin stock y ubicaciones.
- **Entradas**: suman unidades a un ítem (desde la fila o desde _Movimientos_ con buscador).
- **Edición con auditoría**: si cambia la cantidad se registra un _ajuste_ con motivo, usuario y fecha.
- **Historial de movimientos**: entradas, ajustes, altas e importaciones; por ítem y global.
- **Importar Excel (.xlsx)**: vista previa antes de aplicar (nuevos / actualizados / sin cambios / errores
  por fila). Dos modos: _sincronizar cantidades_ o _sumar como entrada_. Transaccional: se aplica todo o nada.
- **Exportar Excel**: respeta los filtros activos y usa el mismo formato que el importador, así un archivo
  exportado se puede editar y volver a importar.
- **Autenticación** con correo y contraseña, sesiones en base de datos, límite de intentos y sin registro
  público (las cuentas las crea un administrador).
- Modo claro/oscuro, diseño responsive y animaciones que respetan `prefers-reduced-motion`.

### Formato del Excel

La primera fila debe tener los encabezados (el orden no importa; se ignoran tildes y mayúsculas):

| Código | Nombre                | Cantidad | Ubicación |
| ------ | --------------------- | -------- | --------- |
| 000013 | Cinta métrica Stanley | 1        | Bodega    |

- **Código** identifica el ítem y se guarda como texto (se conservan ceros iniciales).
- **Cantidad** debe ser un entero ≥ 0 (vacío = 0). **Ubicación** es opcional; las nuevas se crean solas.
- Puedes descargar una plantilla desde _Importar Excel → Descargar plantilla_.

## Stack

| Capa               | Tecnología                                                                      | Costo           |
| ------------------ | ------------------------------------------------------------------------------- | --------------- |
| Frontend + backend | Next.js 16 (App Router, Server Actions, Cache Components), React 19, TypeScript | —               |
| UI                 | Tailwind CSS v4, Radix UI, Motion, Lucide                                       | —               |
| Base de datos      | PostgreSQL en [Neon](https://neon.tech) + Drizzle ORM                           | Gratis (0.5 GB) |
| Auth               | Better Auth (email/contraseña, rate limit en BD)                                | —               |
| Hosting            | [Vercel](https://vercel.com) Hobby                                              | Gratis          |

> **¿Por qué Neon y no Supabase?** Ambos funcionan (solo cambia `DATABASE_URL`), pero el plan gratis de
> Supabase pausa el proyecto tras 7 días sin actividad y hay que reactivarlo a mano. Neon se suspende
> y despierta solo con la siguiente consulta (~0.5 s la primera vez).

## Arquitectura

```
src/
├── app/                    Rutas (App Router)
│   ├── (app)/              Área autenticada: inventario, inventario/[id], entradas, importar
│   ├── api/auth/           Endpoints de Better Auth
│   ├── api/export/         Descarga del Excel
│   └── login/
├── components/
│   ├── ui/                 Sistema de diseño reutilizable (Button, Field, Dialog, Table, Badge…)
│   ├── layout/             Shell, navegación, menú de usuario
│   └── inventory/          Componentes de dominio (tabla, diálogos, importador)
├── hooks/                  useActionForm, useResetKey
├── lib/                    Lógica pura y compartida (parser de Excel, validación, filtros, formato) + tests
├── server/
│   ├── actions/            Server Actions (mutaciones)
│   ├── queries/            Lecturas (Data Access Layer)
│   ├── db/                 Esquema Drizzle y cliente
│   ├── auth.ts, session.ts Configuración de auth y guardas
│   └── excel.ts            Lectura/escritura .xlsx
└── proxy.ts                Redirección optimista a /login
drizzle/                    Migraciones SQL versionadas
scripts/                    migrate.mts, create-user.mts
```

Decisiones clave:

- **Seguridad en capas**: `proxy.ts` solo redirige; la autorización real está en `requireUser()`, que llama
  cada query y cada Server Action. Todo input se valida con Zod en el servidor.
- **Integridad del stock**: las entradas usan incremento atómico (`quantity = quantity + n`), las ediciones
  bloquean la fila (`SELECT … FOR UPDATE`) y existe un `CHECK (quantity >= 0)` en la base.
- **Libro de movimientos** inmutable: cada cambio de cantidad guarda delta, total resultante, usuario y nota.
- **Importación en dos pasos**: la vista previa no escribe nada; al confirmar se vuelve a calcular el plan
  contra el estado actual dentro de una transacción.
- **Sistema de diseño por tokens**: todos los colores salen de variables CSS en `src/app/globals.css`
  (claro/oscuro); los componentes nunca usan colores sueltos.

## Desarrollo local

Requisitos: Node 22+, pnpm y Docker.

```bash
pnpm install
cp .env.example .env            # y completa BETTER_AUTH_SECRET (openssl rand -base64 48)
docker compose up -d            # Postgres local en el puerto 5433
pnpm db:migrate
pnpm user:create --email tu@correo.com --name "Tu Nombre"
pnpm dev                        # http://localhost:3000
```

Scripts útiles:

| Comando                                              | Qué hace                                     |
| ---------------------------------------------------- | -------------------------------------------- |
| `pnpm test`                                          | Tests unitarios (Vitest)                     |
| `pnpm lint` / `pnpm typecheck` / `pnpm format`       | Calidad de código                            |
| `pnpm db:generate --name <cambio>`                   | Genera una migración tras editar `schema.ts` |
| `pnpm db:migrate`                                    | Aplica migraciones pendientes                |
| `pnpm db:studio`                                     | Explorador visual de la base                 |
| `pnpm user:create --email … --name … [--password …]` | Crea un usuario o restablece su contraseña   |

## Despliegue a producción (gratis)

### 1. Base de datos en Neon

1. Crea una cuenta en [neon.tech](https://neon.tech) y un proyecto (región: la más cercana, p. ej. `us-east-1`).
2. En **Connection details** activa **Pooled connection** y copia la cadena
   (`postgresql://…-pooler…/neondb?sslmode=require`).

### 2. App en Vercel

1. Sube el repositorio a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repositorio.
3. En **Environment Variables** agrega:

   | Variable             | Valor                                                     |
   | -------------------- | --------------------------------------------------------- |
   | `DATABASE_URL`       | La cadena _pooled_ de Neon                                |
   | `BETTER_AUTH_SECRET` | Resultado de `openssl rand -base64 48`                    |
   | `BETTER_AUTH_URL`    | La URL final, p. ej. `https://linc-inventario.vercel.app` |

4. **Deploy**. El script `vercel-build` aplica las migraciones automáticamente antes de compilar.

### 3. Crear el primer usuario

Desde tu máquina, apuntando a la base de producción:

```bash
DATABASE_URL="<cadena de Neon>" pnpm user:create --email admin@tu-dominio.com --name "Administrador"
```

Se imprimirá una contraseña temporal; cámbiala desde el menú de usuario → _Cambiar contraseña_.

### 4. Cargar el inventario

Entra a **Importar Excel**, sube tu archivo y confirma la vista previa.

> Los despliegues _preview_ de Vercel usan las mismas variables. Si vas a probar cambios de esquema en
> ramas, usa la integración Neon ↔ Vercel para que cada preview tenga su propia rama de base de datos.

## Configuración opcional

| Variable                | Por defecto          | Uso                              |
| ----------------------- | -------------------- | -------------------------------- |
| `NEXT_PUBLIC_TIME_ZONE` | `America/Costa_Rica` | Zona horaria para mostrar fechas |
