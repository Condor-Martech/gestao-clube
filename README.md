# Gerenciamento Clube Condor — Next.js 16

Sistema de gerenciamento del app móvil **Clube Condor**: módulo de ofertas (campanhas, banners, productos, lojas, agrupamentos) e inteligencia de App Stores (Play Store + App Store con análisis IA de reviews). Heredado del scaffold de "Ativação de Ofertas" — la migración del proyecto Flutter Web en [`../../legacy/`](../../legacy/) a Next.js 16 + Supabase.

📚 **Documentación completa**: [`../../docs/`](../../docs/)

---

## Requisitos

- Node.js >= 20
- npm (el equipo usa npm; si usás otro PM, ajustá los scripts)
- Acceso al proyecto Supabase (ver con tech lead para credenciales)

---

## Setup local

```bash
# 1. Variables de entorno
# Crear .env.local copiando el template del documento de configuración
# Ver: ../../docs/08_ENV_CONFIG.md (sección ".env.example completo")
# Pegar el bloque, guardar como .env.local, y completar valores.

# 2. Instalar dependencias
npm install

# 3. (Opcional) Regenerar tipos de Supabase
npm run db:types

# 4. Dev server
npm run dev
```

Abrir http://localhost:3000 — se redirige a `/login` si no hay sesión.

> **Nota**: el archivo `.env.example` no se commitea como template — el contenido vive en [`../../docs/08_ENV_CONFIG.md`](../../docs/08_ENV_CONFIG.md) como fuente de verdad. Cuando el equipo defina los valores reales de staging, se puede generar `.env.example` localmente.

---

## Scripts

| Script | Hace |
|--------|------|
| `npm run dev` | Dev server con Turbopack en puerto 3000 |
| `npm run build` | Build de producción |
| `npm run start` | Server de producción (después de build) |
| `npm run type-check` | TSC sin emit |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (escribe) |
| `npm run format:check` | Prettier (solo verifica) |
| `npm run test` | Vitest watch |
| `npm run test:run` | Vitest single-pass |
| `npm run test:coverage` | Vitest con coverage |
| `npm run test:e2e` | Playwright |
| `npm run db:types` | Regenera `types/database.types.ts` desde Supabase |

---

## Estructura

```
apps/web/
├── app/                # App Router
│   ├── (auth)/         # Layout público (login)
│   ├── (dashboard)/    # Layout protegido (con sidebar)
│   ├── api/            # Route Handlers (Stripe, Evolution, Condor)
│   ├── layout.tsx
│   ├── page.tsx        # redirect según auth
│   ├── providers.tsx   # TanStack Query, Theme
│   └── globals.css
├── components/
│   └── ui/             # shadcn/ui (a generar con npx shadcn@latest add ...)
├── lib/
│   ├── supabase/       # Clientes browser, server, middleware
│   ├── env.ts          # Validación de env con zod
│   └── utils.ts        # cn() helper
├── hooks/              # TanStack Query hooks
├── stores/             # Zustand stores
├── types/              # Tipos generados de Supabase + helpers
├── middleware.ts       # Auth refresh + protección de rutas
└── ...
```

Ver [`../../docs/02_TECHNICAL_SPEC.md`](../../docs/02_TECHNICAL_SPEC.md) para convenciones.

---

## Stack

- **Framework**: Next.js 16 (App Router, RSC, Turbopack)
- **UI**: Tailwind v4 + shadcn/ui (instalar componentes: `npx shadcn@latest add button input dialog form table dropdown-menu`)
- **Forms**: react-hook-form + zod
- **Server state**: TanStack Query
- **Client state**: Zustand
- **Backend**: Supabase (Auth, DB, Storage, Realtime)
- **Tests**: Vitest + RTL + Playwright

Ver [`../../docs/02_TECHNICAL_SPEC.md`](../../docs/02_TECHNICAL_SPEC.md) para detalles.

---

## Estado de la migración

Este scaffold es el output de la **Fase 0** del plan documentado en [`../../docs/03_MIGRATION_PLAN.md`](../../docs/03_MIGRATION_PLAN.md).

Próximas fases:
- **Fase 1**: Auth (login, middleware, logout)
- **Fase 2**: Layout & Theme (sidebar, theme toggle)
- **Fase 3**: Pantallas read-only (dashboard, lojas, logs, history)
- ...

Ver el plan completo para todas las fases.

---

## Troubleshooting

### `Invalid environment variables`
Faltan vars en `.env.local`. Comparar con `.env.example` y ver [`../../docs/08_ENV_CONFIG.md`](../../docs/08_ENV_CONFIG.md).

### Tipos de Supabase desactualizados
```bash
npm run db:types
```
Requiere `SUPABASE_PROJECT_ID` en env.

### shadcn no instala
```bash
npx shadcn@latest init
# Si pregunta, decir que sí a "use existing components.json"
```

---

## Seguridad — TODOs heredados del legacy

🔒 Estos issues vienen del legacy y se atacan en **Fase 9** del plan de migración:

- Migrar Stripe calls a Route Handlers (server-only).
- Migrar Condor webhooks a Route Handlers.
- Auditar RLS en todas las tablas de Supabase.
- Restricciones de dominio en Google Maps API key.
- Stripe webhook signature verification.

Ver [`../../docs/06_API_CONTRACTS.md`](../../docs/06_API_CONTRACTS.md) para detalles.
