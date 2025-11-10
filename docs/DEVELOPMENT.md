# Guía de Desarrollo - EnVivo

## Setup Local

**Ver [README.md](../README.md#quick-start) para instrucciones completas de instalación.**

Requisitos: Node.js 20+, npm 9+

---

## Buenas Prácticas TypeScript

### Strict Mode (Siempre Habilitado)

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

### Evitar `any`, Usar `unknown`

```typescript
// ❌ Malo
function process(data: any) { }

// ✅ Bueno
function process(data: unknown) {
  if (typeof data === 'string') {
    // Type narrowing
  }
}
```

### Type Guards y Narrowing

```typescript
function isHealthCheckable(source: IDataSource): source is IDataSource & IHealthCheckable {
  return 'healthCheck' in source;
}

if (isHealthCheckable(source)) {
  await source.healthCheck(); // Type-safe
}
```

### Utility Types

```typescript
// Partial, Pick, Omit, Record
type UpdateEvent = Partial<Event>;
type EventPreview = Pick<Event, 'id' | 'title' | 'date'>;
type EventWithoutId = Omit<Event, 'id'>;
type EventMap = Record<string, Event>;
```

### Inmutabilidad Preferida

```typescript
// ❌ Mutación
events.push(newEvent);

// ✅ Inmutable
const updatedEvents = [...events, newEvent];
```

---

## Buenas Prácticas React/Next.js

### Server Components por Defecto

```typescript
// app/eventos/page.tsx
export default async function EventosPage() {
  const events = await getEvents(); // Server-side
  return <EventList events={events} />;
}
```

### Client Components Solo Cuando Necesario

```typescript
// 'use client' solo si usa hooks/eventos
'use client';
import { useState } from 'react';

export function SearchBar() {
  const [query, setQuery] = useState('');
  // ...
}
```

### Composición sobre Herencia

```typescript
// ✅ Bueno: Composición
<Layout>
  <Header />
  <EventList events={events} />
</Layout>

// ❌ Evitar: Clases con herencia profunda
```

### Hooks Rules

- Solo en componentes funcionales o custom hooks
- No en condicionales/loops
- Prefix con `use`: `useEvents()`, `useSearch()`

---

## Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor desarrollo (http://localhost:3000) |
| `npm run build` | Build de producción |
| `npm run start` | Servidor producción (después de build) |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint con auto-fix |
| `npm run type-check` | TypeScript check sin build |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests con coverage report |
| `npm run test:e2e` | Tests E2E (Playwright) |
| `npx prisma studio` | UI para base de datos |
| `npx prisma migrate dev` | Crear migración |

---

## Testing

### Stack de Testing

- **Vitest**: Tests unitarios e integración
- **React Testing Library**: Tests de componentes
- **Playwright** (planificado Fase 7): Tests E2E

### Comandos de Testing

```bash
# Tests unitarios
npm test

# Tests en modo watch (desarrollo)
npm run test:watch

# Tests con UI interactiva
npm run test:ui

# Coverage report
npm run test:coverage

# Type checking
npm run type-check
```

### Objetivos de Cobertura

| Capa | Cobertura Objetivo | Estado Actual | Prioridad |
|------|-------------------|---------------|-----------|
| **Domain** (Business Rules) | >80% | 0% (Fase 2) | 🔴 CRÍTICO |
| **Data** (Repositories) | >70% | 100% (Fase 1 ✅) | 🟡 IMPORTANTE |
| **Data** (Scrapers) | >60% | 100% (Fase 1 ✅) | 🟡 IMPORTANTE |
| **UI** (Componentes) | >60% | 0% (Fase 3+) | 🟢 DESEABLE |
| **E2E** (Flujos críticos) | 100% happy paths | 0% (Fase 7) | 🔴 CRÍTICO |

### Organización de Tests

```
tests/
├── unit/                       # Tests unitarios
│   ├── domain/
│   │   ├── entities/
│   │   │   └── Event.test.ts
│   │   └── services/
│   │       └── EventService.test.ts
│   └── data/
│       ├── mappers/
│       │   └── TicketmasterMapper.test.ts
│       └── sources/
│           └── TicketmasterSource.test.ts
└── integration/                # Tests de integración
    └── repositories/
        └── PrismaEventRepository.test.ts
```

### Buenas Prácticas de Testing

**Naming Convention:**
```typescript
// Formato: describe('Componente/Función', () => { test('debe ...', () => {}) })
describe('TicketmasterMapper', () => {
  describe('toRawEvent', () => {
    test('debe mapear evento completo de Ticketmaster a RawEvent', () => {})
    test('debe manejar evento sin imagen con placeholder', () => {})
    test('debe rechazar evento sin ID', () => {})
  })
})
```

**AAA Pattern** (Arrange, Act, Assert):
```typescript
test('debe crear evento válido', () => {
  // Arrange
  const data = { title: 'Concierto', date: new Date() };

  // Act
  const event = Event.create(data);

  // Assert
  expect(event.title).toBe('Concierto');
});
```

**Mocks vs Real Implementations:**
```typescript
// ✅ Bueno: Mock solo dependencias externas (APIs, DB)
const mockFetch = vi.fn().mockResolvedValue(mockApiResponse);

// ❌ Malo: Mockear lógica de negocio
const mockEventService = vi.fn(); // Testear la implementación real
```

---

## Estructura del Proyecto

### Arquitectura de Carpetas

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx               # Página principal (listado eventos)
│   ├── layout.tsx
│   └── api/
│       └── admin/
│           └── scraper/
│               └── sync/
│                   └── route.ts
├── features/                   # Features organizadas por dominio
│   └── events/
│       ├── domain/            # Lógica de negocio (pura)
│       │   ├── entities/      # Event, Venue (clases/tipos)
│       │   ├── interfaces/    # IDataSource, IEventRepository
│       │   └── services/      # EventService (planificado Fase 2+)
│       ├── data/              # Implementaciones I/O
│       │   ├── sources/       # TicketmasterSource, EventbriteSource
│       │   ├── mappers/       # TicketmasterMapper (API → Domain)
│       │   ├── repositories/  # PrismaEventRepository
│       │   └── orchestrator/  # DataSourceOrchestrator (planificado Fase 4)
│       └── ui/                # Componentes React
│           └── components/    # EventCard, EventList
├── shared/                     # Código compartido entre features
│   ├── infrastructure/
│   │   ├── database/          # prisma/schema.prisma, client
│   │   └── config/            # env.ts (validación Zod)
│   └── lib/                   # Utilidades generales
└── tests/                     # Tests (ver sección Testing)
```

**Ver [../README.md#estructura-del-proyecto](../README.md#estructura-del-proyecto) para estructura completa.**

### Naming Conventions

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| **Interfaces** | Prefijo `I` | `IDataSource`, `IEventRepository` |
| **Implementations** | Nombre descriptivo | `TicketmasterSource`, `PrismaEventRepository` |
| **Mappers** | Sufijo `Mapper`, sin interface | `TicketmasterMapper` (métodos estáticos) |
| **Services** | Sufijo `Service` | `EventService` (planificado Fase 2+) |
| **Business Rules** | Sufijo `Rules` | `EventBusinessRules` (planificado Fase 2) |
| **Components** | PascalCase | `EventCard`, `SearchBar` |
| **Hooks** | Prefijo `use` | `useEvents`, `useSearch` |

**Ver [../CLAUDE.md#naming-conventions](../CLAUDE.md#naming-conventions) para convenciones completas.**

---

## Setup de Variables de Entorno

### Archivos de Entorno

| Archivo | Propósito | Git | Prioridad Next.js |
|---------|-----------|-----|-------------------|
| **`.env.example`** | Template con variables de ejemplo | ✅ Commiteado | - |
| **`.env.local`** | Valores reales para desarrollo local | ❌ Gitignored | **Alta** |

**❌ NO usar `.env`** - Para evitar confusión entre dev y production. Usar solo `.env.local`.

### Setup Inicial

```bash
# 1. Copiar template
cp .env.example .env.local

# 2. Generar ADMIN_API_KEY seguro (32+ caracteres)
# Opción A - OpenSSL (Linux/Mac)
openssl rand -base64 32

# Opción B - Node.js (cualquier OS)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opción C - PowerShell (Windows)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# 3. Editar .env.local con valores reales
```

### Variables Requeridas

```bash
# .env.local (mínimo para desarrollo)
DATABASE_URL="file:./dev.db"
TICKETMASTER_API_KEY="tu-api-key-aqui"
ADMIN_API_KEY="clave-segura-generada-arriba"

# Públicas (expuestas al cliente con NEXT_PUBLIC_)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="EnVivo"
```

### Validación con Zod

Las variables de entorno se validan automáticamente en `src/shared/infrastructure/config/env.ts`:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  TICKETMASTER_API_KEY: z.string().min(1),
  ADMIN_API_KEY: z.string().min(32),
  // ...
});

export const env = envSchema.parse(process.env);
```

**Si una variable falta o es inválida, la app falla al iniciar con error claro.**

### Seguridad

- ✅ Usar `.env.local` para desarrollo local
- ✅ Usar `NEXT_PUBLIC_*` SOLO para variables que DEBEN ser públicas
- ❌ NUNCA commitear `.env.local` a Git
- ❌ NUNCA usar `NEXT_PUBLIC_*` para secretos o API keys

**Ver [docs/examples/env-example.ts](examples/env-example.ts) para lista completa de variables.**

---

## Database Setup (Prisma + SQLite)

### Setup Inicial

```bash
# 1. Instalar dependencias
npm install

# 2. Generar Prisma Client
npx prisma generate

# 3. Ejecutar migraciones
npx prisma migrate dev

# 4. (Opcional) Abrir Prisma Studio
npx prisma studio
```

### Schema de Base de Datos

Ver schema completo en `prisma/schema.prisma`.

**Modelo principal (Fase 1)**:
```prisma
model Event {
  id        String   @id @default(cuid())
  title     String
  date      DateTime
  venue     String
  city      String
  country   String
  imageUrl  String?
  ticketUrl String?
  source    String   // "ticketmaster", "eventbrite", etc.
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Comandos Prisma Útiles

```bash
# Crear nueva migración después de cambiar schema
npx prisma migrate dev --name descripcion-cambio

# Reset completo de la BD (CUIDADO: borra datos)
npx prisma migrate reset

# Ver BD en navegador
npx prisma studio

# Generar types de TypeScript
npx prisma generate
```

**Ver [ARCHITECTURE.md#database-schema](ARCHITECTURE.md#database-schema) para detalles de arquitectura de datos.**

---

## Debugging

### Console Logs vs Debugger

```typescript
// Desarrollo: console.log OK
console.log('Events:', events);

// Producción: usar logger (Pino)
logger.info({ eventCount: events.length }, 'Events fetched');

// Debugging interactivo: breakpoints en VSCode
debugger; // O usar F9 en VSCode
```

### Next.js Debugging (VSCode)

`.vscode/launch.json`:
```json
{
  "configurations": [
    {
      "name": "Next.js: debug server",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

### React DevTools

- Chrome extension: React Developer Tools
- Inspeccionar componentes, props, state
- Profiler para performance

---

## Performance Tips

### Lazy Loading

```typescript
// Componentes pesados
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton />
});
```

### Image Optimization

```typescript
// Usar Next.js Image
import Image from 'next/image';

<Image
  src={event.imageUrl}
  alt={event.title}
  width={300}
  height={200}
  loading="lazy"
/>
```

### Memoization

```typescript
// Cálculos costosos
const filteredEvents = useMemo(
  () => events.filter(e => e.city === city),
  [events, city]
);

// Callbacks estables
const handleSearch = useCallback((query: string) => {
  // ...
}, []);
```

### Bundle Analysis

```bash
npm run build
# Revisar .next/analyze/client.html
```

---

## See Also

### Documentación Relacionada

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Clean Architecture, SOLID principles, ADRs
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Git workflow, code review, testing requirements
- **[PRODUCT.md](PRODUCT.md)** - Features, user stories, roadmap
- **[SECURITY.md](SECURITY.md)** - Security best practices, attack vectors, defense in depth
- **[README.md](../README.md)** - Project overview, quick start, estructura completa

### Ejemplos de Código

- **[examples/](examples/)** - Ejemplos de implementación (scrapers, business rules, testing, security)

---

## Documentation Guidelines

Cuando documentes código o features, sigue el principio **"Single Source of Truth"** documentado en [CONTRIBUTING.md#documentation-as-code-single-source-of-truth-ssot](CONTRIBUTING.md#documentation-as-code-single-source-of-truth-ssot).

**Quick checklist**:
- [ ] ¿Esta información ya existe en otro doc? → Link a ella en vez de repetir
- [ ] ¿Es información nueva? → Elige UNA ubicación primaria (consulta SSOT Registry)
- [ ] ¿Contradice docs existentes? → Actualiza el SSOT primero, luego referencias

---

**Última actualización**: Noviembre 2025
