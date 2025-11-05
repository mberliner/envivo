# EnVivo - Buscador de Espectáculos Musicales

Agregador de eventos musicales en vivo con scraping asíncrono, Clean Architecture y SOLID principles.

## ⚡ Stack Tecnológico

- **Framework**: Next.js 14+ con App Router
- **Lenguaje**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Base de Datos**: SQLite con Prisma ORM (MVP) / PostgreSQL (producción)
- **Búsqueda**: SQLite FTS5 (Full-Text Search)
- **Testing**: Vitest + Playwright + React Testing Library
- **Scraping**: Cheerio + Axios (async con p-limit)
  - Playwright disponible para sitios dinámicos (JS-heavy)
- **Deploy**: Vercel (gratis)

## 🚀 Quick Start

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd envivo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las siguientes variables REQUERIDAS:
#   TICKETMASTER_API_KEY=tu-api-key
#   ADMIN_API_KEY=clave-minimo-32-caracteres-para-scraping
#   DATABASE_URL="file:./dev.db"

# 4. Setup base de datos
npx prisma generate
npx prisma db push

# 5. Iniciar servidor de desarrollo
npm run dev

# 6. Poblar base de datos con scraping inicial (en otra terminal)
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: tu-clave-del-env-ADMIN_API_KEY"
```

**Nota**: La BD inicia vacía. El paso 6 es **obligatorio** para tener datos iniciales.

Abrir [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
envivo/
├── src/
│   ├── app/                          # Next.js App Router (UI)
│   │   ├── (home)/page.tsx
│   │   ├── eventos/[id]/page.tsx
│   │   └── api/eventos/route.ts
│   │
│   ├── features/                     # Módulos por Feature
│   │   └── events/
│   │       ├── domain/               # Lógica de negocio
│   │       │   ├── entities/
│   │       │   ├── services/
│   │       │   └── rules/            # Business rules
│   │       ├── data/                 # Capa de datos
│   │       │   ├── repositories/
│   │       │   ├── orchestrator/     # Scraping asíncrono
│   │       │   └── sources/          # Scrapers y API clients
│   │       └── ui/                   # Componentes React
│   │
│   └── shared/                       # Código compartido
│       ├── infrastructure/
│       │   ├── database/
│       │   ├── logging/
│       │   └── config/
│       └── ui/                       # Componentes genéricos
│
├── docs/
│   ├── ARCHITECTURE.md               # Arquitectura técnica
│   ├── PRODUCT.md                    # Épicas, user stories, roadmap
│   └── examples/                     # Ejemplos de código
│
├── CLAUDE.md                         # Contexto para Claude Code
└── prisma/
    └── schema.prisma
```

## 🎯 Features del MVP

- ⏳ Búsqueda por texto (título, artista, venue)
- ⏳ Filtros por ciudad, fecha, categoría
- ⏳ Detalle completo de eventos
- ⏳ Scraping asíncrono de múltiples fuentes
- ⏳ Integración con Ticketmaster API
- ⏳ Validación y deduplicación automática
- ⏳ Búsqueda geográfica ("eventos cerca de mí")

**Estado**: En fase de implementación - Ver sección [Estado del Proyecto](#-estado-del-proyecto)

## 📚 Documentación

- **[Arquitectura](docs/ARCHITECTURE.md)** - Clean Architecture, SOLID, scraping asíncrono
- **[Product & Roadmap](docs/PRODUCT.md)** - Épicas, user stories, plan de implementación
- **[Para Claude Code](CLAUDE.md)** - Contexto completo del proyecto para AI

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests con coverage
npm run test:coverage

# Tests E2E
npm run test:e2e

# Type checking
npm run type-check
```

## 🔒 Seguridad

- Validación de entrada con Zod
- Sanitización de datos scrapeados (DOMPurify)
- Rate limiting en endpoints públicos
- Headers de seguridad (CSP, HSTS)
- Secrets management (.env, nunca en código)

## 🚢 Deploy

```bash
# Build de producción
npm run build

# Preview
npm run start
```

Deploy automático a Vercel en push a `main`.

## 📊 Comandos Útiles

```bash
# Linting
npm run lint
npm run lint:fix

# Formateo
npm run format

# Prisma
npx prisma studio          # UI para base de datos
npx prisma migrate dev     # Crear migración

# Scraping manual
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: your-admin-key"

# Re-scraping con preferencias actualizadas
curl -X POST "http://localhost:3000/api/admin/scraper/sync?applyNewPreferences=true" \
  -H "x-api-key: your-admin-key"

# Ver estado del scraping
curl http://localhost:3000/api/scraper/status
```

### Preferencias por Defecto (Primer Scraping)

La primera vez que se ejecuta scraping, se crean automáticamente estas preferencias:

- **Países**: Solo Argentina (`AR`)
- **Ciudades**: Buenos Aires, Ciudad de Buenos Aires, CABA
- **Categorías**: Music, Concert, Festival
- **Tamaños de venue**: Todos (small, medium, large)

Para modificar preferencias, actualizar vía endpoint `/api/admin/preferences` (ver [PRODUCT.md](docs/PRODUCT.md) - US1.4).

## 🚀 Estado del Proyecto

### Fase Actual: Fase 0 - Setup & Configuración

**Estrategia de Implementación**: Vertical Slices (features end-to-end)

El proyecto sigue un enfoque de **vertical slices** en lugar de implementación horizontal por capas. Esto significa que cada fase implementa una feature completa desde el backend hasta la UI, proveyendo valor inmediato.

### Roadmap de Implementación

| Fase | Duración | Objetivo | Estado |
|------|----------|----------|--------|
| **Fase 0** | 4-6 horas | Setup inicial + estructura base | 🚧 En progreso |
| **Fase 1** | 1-2 días | Ticketmaster → BD → UI (primer valor) | ⏳ Pendiente |
| **Fase 2** | 1 día | Business Rules + Deduplicación | ⏳ Pendiente |
| **Fase 3** | 1-2 días | Búsqueda + Filtros | ⏳ Pendiente |
| **Fase 4** | 1 día | Orchestrator asíncrono | ⏳ Pendiente |
| **Fase 5** | 1 día | Segunda fuente + Detalle | ⏳ Pendiente |
| **Fase 6** | 1 día | Scraping automático + Deploy | ⏳ Pendiente |
| **Fase 7** | 1 día | Tests E2E + Pulido | ⏳ Pendiente |

**Ver roadmap completo**: [docs/PRODUCT.md (líneas 360-587)](docs/PRODUCT.md#roadmap-de-implementaci%C3%B3n)

### Git Workflow

Durante el MVP, seguimos **trunk-based development**:
- Commit y push directo a `main` después de cada fase completada
- Convención: `feat: [descripción de la fase]`
- Ejemplo: `git commit -m "feat: first vertical slice - Ticketmaster to UI"`

---

## 🤝 Contribuir

Este es un proyecto personal, pero si quieres colaborar:

1. Revisar [CONTRIBUTING.md](docs/CONTRIBUTING.md) para workflow y convenciones
2. Leer [ARCHITECTURE.md](docs/ARCHITECTURE.md) para entender diseño
3. Leer [PRODUCT.md](docs/PRODUCT.md) para ver roadmap
4. Consultar [CLAUDE.md](CLAUDE.md) para convenciones de código
5. Escribir tests para nuevas features

**Nota**: La documentación sigue "Single Source of Truth". Ver [CONTRIBUTING.md#documentation-as-code-single-source-of-truth-ssot](docs/CONTRIBUTING.md#documentation-as-code-single-source-of-truth-ssot) para entender cómo está organizada.

## 📝 Licencia

MIT

## 👤 Autor

Claudio

---

**Última actualización**: Enero 2025
