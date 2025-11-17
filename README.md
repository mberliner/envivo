# EnVivo - Encontrá Eventos Musicales en Argentina

**EnVivo** es un agregador de eventos musicales que reúne shows, conciertos y festivales de múltiples fuentes en Argentina. En lugar de visitar varios sitios web, encontrá todos los eventos en un solo lugar.

## ✨ Características

- 🔍 **Búsqueda unificada** - Eventos de Ticketmaster, LivePass, Movistar Arena, Teatro Coliseo y más
- 🎯 **Filtros inteligentes** - Por ciudad, fecha, género y categoría musical
- 🎵 **Sin duplicados** - Deduplicación automática entre fuentes
- 📱 **Responsive** - Funciona en desktop, tablet y móvil
- 🆓 **Gratis y open source** - Sin costo, código abierto

## 🚀 Quick Start (Desarrolladores)

```bash
# 1. Clonar e instalar
git clone <repo-url>
cd envivo
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local:
#   ADMIN_API_KEY=clave-minimo-32-caracteres
#   DATABASE_URL="file:./dev.db"

# 3. Setup base de datos
npm run db:generate
npm run db:push

# 4. Iniciar servidor
npm run dev

# 5. Poblar base de datos (scraping inicial)
# Ver docs/WEB_SCRAPING.md#scraping-manual
```

Abrir [http://localhost:3000](http://localhost:3000)

## 🎯 Fuentes de Datos Activas

- **Ticketmaster** - Eventos de Ticketmaster Argentina (API oficial)
- **LivePass** - Café Berlín y otros venues locales (web scraping)
- **Movistar Arena** - Eventos de Movistar Arena Buenos Aires
- **Teatro Coliseo** - Teatro, conciertos y festivales en Buenos Aires

> **💡 Agregar nuevas fuentes**: Ver [docs/ADDING_SCRAPERS.md](docs/ADDING_SCRAPERS.md)

## 🛠️ Stack Tecnológico

- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Prisma + SQLite** - Base de datos (MVP)
- **Vitest + Playwright** - Testing

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router (páginas y APIs)
├── features/events/        # Módulo de eventos
│   ├── domain/            # Lógica de negocio
│   ├── data/              # Scrapers, repositories
│   └── ui/                # Componentes React
└── shared/                 # Código compartido
```

## 📚 Documentación para Desarrolladores

### Documentos Principales

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Clean Architecture, SOLID principles, ADRs
- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Setup, testing, debugging, best practices
- **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Git workflow, code review, SSOT
- **[PRODUCT.md](docs/PRODUCT.md)** - Features, user stories, roadmap
- **[SECURITY.md](docs/SECURITY.md)** - Security best practices

### Guías Específicas

- **[WEB_SCRAPING.md](docs/WEB_SCRAPING.md)** - Sistema de scraping (arquitectura, config, troubleshooting)
- **[ADDING_SCRAPERS.md](docs/ADDING_SCRAPERS.md)** - Cómo agregar nuevos sitios web
- **[E2E_TESTING.md](docs/E2E_TESTING.md)** - Tests E2E con Playwright
- **[CLAUDE.md](CLAUDE.md)** - Contexto completo para Claude Code

### Principios de Documentación

La documentación sigue **Single Source of Truth (SSOT)**:
- Cada tema tiene UNA ubicación autoritativa
- Otros docs referencian con links (no duplican)
- Ver [CONTRIBUTING.md#ssot-registry](docs/CONTRIBUTING.md#ssot-registry-qué-va-dónde)

## 🧪 Testing

```bash
# Tests unitarios
npm run test
npm run test:coverage

# Type checking
npm run type-check

# Tests E2E
npm run test:e2e
npm run test:e2e:ui
```

**Stack**: Vitest + React Testing Library + Playwright (E2E con BD separada)

Ver [docs/DEVELOPMENT.md#testing](docs/DEVELOPMENT.md#testing) para objetivos de cobertura.

## 🔒 Seguridad

- ✅ Validación de entrada con Zod
- ✅ Sanitización de datos scrapeados (DOMPurify)
- ✅ Rate limiting en endpoints
- ✅ Headers de seguridad (CSP, HSTS)

Ver [docs/SECURITY.md](docs/SECURITY.md) para guía completa.

## 🚢 Deploy

```bash
# Build de producción
npm run build
npm run start
```

Deploy automático a Vercel en push a `main`.

Ver [VERCEL_MIGRATION.md](VERCEL_MIGRATION.md) para migración completa (documento temporal).

## 🤝 Contribuir

1. Leer [CONTRIBUTING.md](docs/CONTRIBUTING.md) - Workflow y testing requirements
2. Revisar [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Diseño técnico
3. Consultar [PRODUCT.md](docs/PRODUCT.md) - Roadmap y user stories
4. Escribir tests para nuevas features

## 📊 Estado del Proyecto

**En desarrollo activo** siguiendo estrategia de **Vertical Slices** (features end-to-end).

Ver [docs/PRODUCT.md#roadmap](docs/PRODUCT.md#roadmap-de-implementación) para roadmap completo.

---

**Última actualización**: Diciembre 2025
