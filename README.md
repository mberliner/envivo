# EnVivo - Buscador de Espectáculos Musicales

Agregador de eventos musicales en vivo con scraping asíncrono, Clean Architecture y SOLID principles.

## ⚡ Stack Tecnológico

- **Framework**: Next.js 14+ con App Router
- **Lenguaje**: TypeScript
- **Styling**: Tailwind CSS
- **Base de Datos**: SQLite con Prisma ORM (MVP) / PostgreSQL (producción)
- **Búsqueda**: SQLite FTS5 (Full-Text Search) - Planificado Fase 3
- **Testing**: Vitest + React Testing Library
  - Playwright planificado para tests E2E (Fase 7)
- **Scraping**: Axios (API clients)
  - Cheerio planificado para scrapers HTML (Fase 5)
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

- **Descubrir eventos** - Agregación de eventos de múltiples fuentes (Ticketmaster, LivePass, sitios locales)
- **Búsqueda inteligente** - Buscar por artista, título, venue con filtros (ciudad, fecha, categoría)
- **Información completa** - Detalles de eventos, precios, links a compra de entradas
- **Datos actualizados** - Scraping automático diario con validación y deduplicación
- **Clean Architecture** - Codebase mantenible siguiendo principios SOLID

**Ver roadmap completo**: [docs/PRODUCT.md](docs/PRODUCT.md)

## 📚 Documentación

- **[Arquitectura](docs/ARCHITECTURE.md)** - Clean Architecture, SOLID, scraping asíncrono
- **[Product & Roadmap](docs/PRODUCT.md)** - Épicas, user stories, plan de implementación
- **[Para Claude Code](CLAUDE.md)** - Contexto completo del proyecto para AI

## 🧪 Testing

```bash
# Tests unitarios (152 tests, 100% passing)
npm run test

# Tests con UI interactiva
npm run test:ui

# Type checking
npm run type-check
```

**Cobertura actual**:
- Data layer (mappers, sources, repositories): 100%
- Security utilities (sanitize, validation): 100%
- UI components (EventDetail, EventCard): 100%

**Planificado**: E2E tests con Playwright en Fase 7

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

# Scraping manual (endpoint disponible en Fase 1)
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: YOUR_ADMIN_API_KEY"

# Scraping con parámetros opcionales
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"country": "AR", "city": "Buenos Aires"}'
```

**Nota**: La configuración de preferencias globales y re-scraping avanzado están planificados para Fase 2.

## 🚀 Estado del Proyecto

**Proyecto en desarrollo activo** siguiendo estrategia de **Vertical Slices** (features end-to-end).

**Ver roadmap completo**: [docs/PRODUCT.md](docs/PRODUCT.md#roadmap-de-implementaci%C3%B3n)

### Git Workflow

Durante el MVP, seguimos **trunk-based development**:
- Commits directos después de completar cada fase
- Convención: `feat: [descripción de la fase]`

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

**Última actualización**: 8 de Noviembre de 2025
