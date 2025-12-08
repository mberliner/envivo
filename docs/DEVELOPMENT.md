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

## Code Quality & Linting

### ESLint Configuration

Este proyecto usa ESLint para mantener consistencia y calidad en el código:

- **eslint-config-next** (v16.0.1): Reglas específicas de Next.js
- **eslint-config-prettier** (v10.1.8): Compatibilidad con Prettier
- **@typescript-eslint**: Reglas de TypeScript
- **Configuración**: `eslint.config.mjs` (ESLint 9 flat config)

**Archivos excluidos** (configurados en `eslint.config.mjs`):
- `docs/examples/` (código de referencia)
- `scripts/` (scripts Node.js legacy)
- `.next/`, `node_modules/`, build outputs

**Nota**: ESLint 9+ usa `ignores` en el archivo de config, NO `.eslintignore`.

### Comandos de Linting

```bash
# Verificar issues (sin modificar archivos)
npm run lint

# Auto-fix issues cuando sea posible
npm run lint:fix
```

**Importante**: `npm run lint` es **OBLIGATORIO** antes de cada commit. Ver [CONTRIBUTING.md](CONTRIBUTING.md#testing-requirements) para requisitos completos.

### Reglas ESLint Más Comunes

#### 🔴 Errores Críticos (Deben corregirse)

| Regla | Descripción | Cómo corregir |
|-------|-------------|---------------|
| `@typescript-eslint/no-explicit-any` | Evitar uso de `any` | Usar tipos específicos o `unknown` |
| `@typescript-eslint/no-unused-vars` | Variables/imports no usados | Eliminar o usar con `_` prefix |
| `@typescript-eslint/no-require-imports` | Usar `import` en lugar de `require()` | Convertir a ES modules |
| `@next/next/no-img-element` | Usar `<Image />` de Next.js | Reemplazar `<img>` con `next/image` |

**Ejemplos:**

```typescript
// ❌ Malo: uso de any
function process(data: any) {
  return data.value;
}

// ✅ Bueno: tipo específico
function process(data: { value: string }) {
  return data.value;
}

// ✅ Bueno alternativo: unknown con type guard
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
}
```

```typescript
// ❌ Malo: variable no usada
const [count, setCount] = useState(0);
return <div>Hello</div>;

// ✅ Bueno: eliminar si no se usa
return <div>Hello</div>;

// ✅ Bueno alternativo: prefix con _ si es intencional
const [_count, setCount] = useState(0);
```

```jsx
// ❌ Malo: <img> nativo
<img src="/logo.png" alt="Logo" />

// ✅ Bueno: Next.js Image
import Image from 'next/image';
<Image src="/logo.png" alt="Logo" width={100} height={100} />
```

#### 🟡 Warnings (Recomendaciones)

- **Unused variables**: Revisar si realmente se necesitan
- **Unused eslint-disable**: Eliminar directivas innecesarias
- **Console statements**: Usar logger en producción

### Cuándo Desactivar Reglas

**Usa `eslint-disable` solo cuando**:

1. **False positives** (el error es incorrecto)
2. **Código legacy** que se refactorizará después
3. **Tests** que requieren patrones específicos

**Formatos aceptados:**

```typescript
// Desactivar para línea siguiente
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = JSON.parse(str);

// Desactivar para bloque
/* eslint-disable @typescript-eslint/no-explicit-any */
function legacyCode(data: any) {
  // Código legacy
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Desactivar archivo completo (última opción)
/* eslint-disable @typescript-eslint/no-explicit-any */
```

**❌ NO desactivar**:
- Para evitar corregir código nuevo
- Sin comentario explicando por qué
- Reglas de seguridad

### Integración con IDEs

#### VS Code

1. Instalar extensión: **ESLint** (dbaeumer.vscode-eslint)
2. Agregar a `.vscode/settings.json`:

```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

3. Reiniciar VS Code

#### WebStorm / IntelliJ

1. Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
2. Activar: "Automatic ESLint configuration"
3. Activar: "Run eslint --fix on save"

### Solución de Problemas

**"Error: Failed to load config"**
```bash
# Limpiar cache de ESLint
rm -rf node_modules/.cache/eslint
npm run lint
```

**"Cannot find module 'eslint-config-next'"**
```bash
# Reinstalar dependencias
npm install
```

**"Parsing error" en archivos TS**
- Verificar que `typescript` esté instalado
- Verificar `tsconfig.json` válido

### Referencias

- [ESLint Rules](https://eslint.org/docs/rules/)
- [TypeScript ESLint](https://typescript-eslint.io/rules/)
- [Next.js ESLint](https://nextjs.org/docs/app/api-reference/config/eslint)

---

## Architecture Validation

EnVivo implementa **validación automatizada de Clean Architecture** en 3 capas para prevenir violaciones de las reglas de arquitectura:

### 📐 Reglas de Clean Architecture

El proyecto sigue **Clean Architecture de 3 capas** (UI → Domain → Data).

**Ver [ARCHITECTURE.md#clean-architecture](ARCHITECTURE.md#clean-architecture) para diagrama completo y explicación detallada.**

**Reglas validadas automáticamente:**

1. ✅ **Domain Isolation**: Domain NO puede importar de Data ni UI
2. ✅ **Data → UI Forbidden**: Data NO puede importar de UI
3. ✅ **No Circular Dependencies**: Eliminar dependencias circulares
4. ✅ **Dependency Inversion**: Data implementa interfaces de Domain

### 🛠️ Capa 1: IDE Feedback (ESLint Boundaries)

**Feedback instantáneo en el editor** mientras escribes código.

```bash
# Validar arquitectura manualmente
npm run lint:arch
```

**Configuración**: `eslint.config.mjs` usa `eslint-plugin-boundaries` para detectar violaciones.

**Ejemplo de error**:
```
error  Domain layer CANNOT import from Data or UI layers (Clean Architecture violation)
  src/features/events/domain/services/EventService.ts
    import { PrismaEventRepository } from '../../data/repositories/PrismaEventRepository'
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

**Cómo corregir**:
- Domain debe depender solo de **interfaces** (`IEventRepository`)
- Las implementaciones (`PrismaEventRepository`) deben inyectarse desde afuera

### 🔒 Capa 2: Pre-commit Hook (Husky + lint-staged)

**Bloquea commits** que violen las reglas de arquitectura.

El pre-commit hook ejecuta automáticamente:
- `eslint --fix` en archivos `.ts`/`.tsx` staged
- `prettier --write` en todos los archivos staged

**Configuración**: `.husky/pre-commit` + `lint-staged` en `package.json`

**Si falla el commit**:
```bash
# Ver errores específicos
npm run lint:arch

# Corregir y volver a stagear
git add .
git commit -m "fix: ..."
```

**Bypass (solo en emergencias)**:
```bash
git commit --no-verify -m "..."
```

⚠️ **IMPORTANTE**: NO uses `--no-verify` para evitar corregir violaciones. Los hooks existen para proteger la arquitectura.

### 🚀 Capa 3: CI Validation (Dependency Cruiser)

**Validación exhaustiva en CI** con visualización de dependencias.

El job `verify-architecture` en CI ejecuta:
1. `npm run lint:arch` - ESLint boundaries
2. `npm run validate:deps` - Dependency Cruiser (reglas avanzadas)
3. `npm run validate:deps:graph` - Genera gráfico SVG

**Comandos locales**:
```bash
# Validar dependencias (más exhaustivo que ESLint)
npm run validate:deps

# Generar gráfico de dependencias (requiere Graphviz)
brew install graphviz  # macOS
sudo apt-get install graphviz  # Linux
npm run validate:deps:graph
```

**Gráfico generado**: `docs/architecture-graph.svg`
- Verde: Domain layer
- Azul: Data layer
- Rosa: UI layer
- Amarillo: Shared utilities

**Descarga del gráfico en CI**:
1. Ve a Actions → Workflow run
2. Artifacts → `architecture-dependency-graph`
3. Descarga y abre `architecture-graph.svg`

### 🔍 Interpretación de Errores

#### Error: Circular Dependency

```
error no-circular: src/features/events/data/sources/AllAccessJsonScraper.ts →
    src/features/events/data/sources/AllAccessMapper.ts →
    src/features/events/data/sources/AllAccessJsonScraper.ts
```

**Cómo corregir**:
1. Extraer tipos compartidos a un archivo separado (ej: `AllAccessTypes.ts`)
2. Ambos archivos importan de `AllAccessTypes.ts` (sin ciclo)

#### Error: Domain importing from Data

```
error domain-isolation: src/features/events/domain/services/EventService.ts →
    src/features/events/data/repositories/PrismaEventRepository.ts
```

**Cómo corregir**:
1. EventService debe depender de `IEventRepository` (interface)
2. `PrismaEventRepository` se inyecta vía constructor o DI

```typescript
// ❌ Malo: Domain importa implementación
import { PrismaEventRepository } from '../../data/repositories/PrismaEventRepository';

export class EventService {
  private repo = new PrismaEventRepository();
}

// ✅ Bueno: Domain depende de interface
import { IEventRepository } from '../interfaces/IEventRepository';

export class EventService {
  constructor(private repo: IEventRepository) {}
}
```

### 📊 Estado Actual

**Estado del proyecto (última validación)**:
- ✅ **0 violaciones de arquitectura**
- ✅ **0 dependencias circulares**
- ✅ **Domain layer completamente aislado**
- ✅ **Data layer implementa correctamente interfaces de Domain**

### 🔧 Troubleshooting

**"Error: Cannot find module 'dependency-cruiser'"**
```bash
npm install
```

**Gráfico SVG no se genera**
```bash
# Instalar Graphviz
brew install graphviz  # macOS
sudo apt-get install graphviz  # Linux

# Verificar instalación
dot -V

# Regenerar gráfico
npm run validate:deps:graph
```

**Pre-commit hook no ejecuta**
```bash
# Reinstalar hooks
rm -rf .husky
npx husky init
```

### 📚 Referencias

- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [ESLint Plugin Boundaries](https://github.com/javierbrea/eslint-plugin-boundaries)
- [Dependency Cruiser](https://github.com/sverweij/dependency-cruiser)
- [Architectural Decision Records](ARCHITECTURE.md#architectural-decision-records-adrs)

---

## Testing

### Stack de Testing

- **Vitest**: Tests unitarios e integración
- **React Testing Library**: Tests de componentes
- **Playwright**: Tests E2E con BD separada (e2e.db)

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

# Tests E2E con Playwright
npm run test:e2e              # Modo desarrollo
npm run test:e2e:prod         # Modo producción (build)
npm run test:e2e:ui           # UI de Playwright
npm run test:e2e:debug        # Debug mode

# Setup de BD E2E (primera vez)
npm run db:e2e:init           # Verificar/inicializar BD E2E
npm run db:e2e:studio         # Prisma Studio en BD E2E
```

### Objetivos de Cobertura

| Capa | Cobertura Objetivo | Estado Actual | Prioridad |
|------|-------------------|---------------|-----------|
| **Domain** (Business Rules) | >80% | ✅ 91.89% | 🔴 CRÍTICO |
| **Data** (Repositories) | >70% | ✅ 93.22% | 🟡 IMPORTANTE |
| **Data** (Scrapers) | >60% | ✅ 92.66% | 🟡 IMPORTANTE |
| **UI** (Componentes) | >60% | 0% (pendiente) | 🟢 DESEABLE |
| **E2E** (Flujos críticos) | 100% happy paths | ✅ Implementado | 🔴 CRÍTICO |

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
│       │   └── ExternalApiMapper.test.ts
│       └── sources/
│           └── ExternalApiSource.test.ts
└── integration/                # Tests de integración
    └── repositories/
        └── PrismaEventRepository.test.ts
```

### Buenas Prácticas de Testing

**Naming Convention:**
```typescript
// Formato: describe('Componente/Función', () => { test('debe ...', () => {}) })
describe('ExternalApiMapper', () => {
  describe('toRawEvent', () => {
    test('debe mapear evento completo de API externa a RawEvent', () => {})
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
│       │   ├── sources/       # ExternalApiSource, LivePassSource
│       │   ├── mappers/       # ExternalApiMapper (API → Domain)
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
| **Implementations** | Nombre descriptivo | `ExternalApiSource`, `PrismaEventRepository` |
| **Mappers** | Sufijo `Mapper`, sin interface | `ExternalApiMapper` (métodos estáticos) |
| **Services** | Sufijo `Service` | `EventService` (planificado Fase 2+) |
| **Business Rules** | Sufijo `Rules` | `EventBusinessRules` (planificado Fase 2) |
| **Components** | PascalCase | `EventCard`, `SearchBar` |
| **Hooks** | Prefijo `use` | `useEvents`, `useSearch` |

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
# APIs argentinas (opcionales)
ALLACCESS_API_KEY="tu-api-key-aqui"
EVENTBRITE_API_KEY="tu-api-key-aqui"
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
  ALLACCESS_API_KEY: z.string().optional(),
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

---

## Database Setup (Prisma + SQLite)

### Bases de Datos Separadas

Este proyecto usa **2 bases de datos SQLite separadas**:

| Base de Datos | Archivo | Uso | Variable |
|---------------|---------|-----|----------|
| **Desarrollo** | `dev.db` | Desarrollo normal (`npm run dev`) | `DATABASE_URL` |
| **E2E/Testing** | `e2e.db` | Tests E2E (`npm run test:e2e`) | `DATABASE_URL_E2E` |

**Beneficios:**
- ✅ Tests E2E no contaminan datos de desarrollo
- ✅ Reseteo independiente de cada BD
- ✅ Ejecución paralela de tests sin conflictos

### Setup Inicial

```bash
# 1. Instalar dependencias
npm install

# 2. Generar Prisma Client
npx prisma generate

# 3. Crear BD de desarrollo
DATABASE_URL="file:./dev.db" npx prisma db push

# 4. Crear BD E2E (para tests)
DATABASE_URL="file:./e2e.db" npx prisma db push

# 5. (Opcional) Abrir Prisma Studio
npx prisma studio                    # BD desarrollo
npm run db:e2e:studio                # BD E2E
```

**Ver [E2E_TESTING.md](E2E_TESTING.md) para detalles completos de la configuración E2E.**

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
  source    String   // "allaccess", "eventbrite", etc.
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

Los ejemplos de implementación están inline en la documentación:
- **Scrapers**: Ver [WEB_SCRAPING.md](WEB_SCRAPING.md) y [ADDING_SCRAPERS.md](ADDING_SCRAPERS.md)
- **Business Rules**: Ver [ARCHITECTURE.md#business-rules](ARCHITECTURE.md#business-rules)
- **Security**: Ver [SECURITY.md](SECURITY.md#defense-in-depth-strategy)

---

## Documentation Guidelines

Cuando documentes código o features, sigue el principio **"Single Source of Truth"** documentado en [CONTRIBUTING.md#documentation-as-code-single-source-of-truth-ssot](CONTRIBUTING.md#documentation-as-code-single-source-of-truth-ssot).

**Quick checklist**:
- [ ] ¿Esta información ya existe en otro doc? → Link a ella en vez de repetir
- [ ] ¿Es información nueva? → Elige UNA ubicación primaria (consulta SSOT Registry)
- [ ] ¿Contradice docs existentes? → Actualiza el SSOT primero, luego referencias

---

**Última actualización**: Noviembre 2025
