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
