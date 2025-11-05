/**
 * EJEMPLO COMPLETO: Error Handling & Logging
 *
 * Este archivo muestra cómo implementar:
 * 1. AppError classes personalizadas
 * 2. Error handler global
 * 3. Logging con Pino
 * 4. Error boundaries en React
 * 5. Integración con Sentry (opcional)
 *
 * NOTA: Este es un archivo de EJEMPLO. Copiar código a /src durante implementación.
 */

import pino from 'pino';

// ============================================
// 1. APP ERROR CLASSES
// ============================================

/**
 * Archivo: src/shared/domain/errors/AppError.ts
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Errores específicos

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource}${id ? ` with id ${id}` : ''} not found`,
      'NOT_FOUND',
      404
    );
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(
      `External service ${service} failed`,
      'EXTERNAL_SERVICE_ERROR',
      502
    );
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

export class RateLimitError extends AppError {
  constructor(public retryAfter: Date) {
    super('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
  }
}

export class ScraperError extends AppError {
  constructor(
    source: string,
    originalError: Error,
    public url?: string
  ) {
    super(
      `Scraper ${source} failed: ${originalError.message}`,
      'SCRAPER_ERROR',
      500
    );
    this.stack = originalError.stack;
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, originalError: Error) {
    super(
      `Database ${operation} failed: ${originalError.message}`,
      'DATABASE_ERROR',
      500,
      false // No operacional, error crítico
    );
    this.stack = originalError.stack;
  }
}

// ============================================
// 2. LOGGING CON PINO
// ============================================

/**
 * Archivo: src/shared/infrastructure/logging/logger.ts
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Pretty print en desarrollo
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname'
        }
      }
    : undefined,

  // Formateo para producción (JSON estructurado)
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      environment: process.env.NODE_ENV
    })
  },

  // Redactar información sensible
  redact: {
    paths: [
      'apiKey',
      'password',
      'token',
      'authorization',
      'cookie',
      '*.apiKey',
      '*.password',
      '*.token'
    ],
    remove: true
  }
});

/**
 * Logger específico por módulo
 */
export function createLogger(module: string) {
  return logger.child({ module });
}

// ============================================
// 3. USO DE LOGGER EN SCRAPERS
// ============================================

/**
 * Archivo: src/features/events/data/orchestrator/DataSourceOrchestrator.ts
 */

import { createLogger } from '@/shared/infrastructure/logging/logger';

const logger = createLogger('DataSourceOrchestrator');

export class DataSourceOrchestrator {
  async fetchAll(options?: OrchestrationOptions): Promise<OrchestratorResult> {
    const startTime = Date.now();

    logger.info({
      msg: 'Starting scraping',
      sources: this.sources.size,
      concurrency: options?.concurrency || 5
    });

    try {
      const results = await Promise.allSettled(/* ... */);
      const duration = Date.now() - startTime;

      logger.info({
        msg: 'Scraping completed',
        successful: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        durationMs: duration
      });

      return this.aggregateResults(results, duration);

    } catch (error) {
      logger.error({
        msg: 'Scraping failed',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  private async fetchWithRetry(source: IDataSource, retries: number) {
    const sourceLogger = logger.child({ source: source.name });

    try {
      sourceLogger.debug('Starting fetch');

      const events = await pRetry(/* ... */, {
        onFailedAttempt: (error) => {
          sourceLogger.warn({
            msg: 'Retry attempt',
            attempt: error.attemptNumber,
            retriesLeft: error.retriesLeft,
            error: error.message
          });
        }
      });

      sourceLogger.info({
        msg: 'Fetch successful',
        eventsCount: events.length
      });

      return events;

    } catch (error) {
      sourceLogger.error({
        msg: 'Fetch failed after retries',
        error: error.message,
        retries
      });
      throw new ScraperError(source.name, error);
    }
  }
}

// ============================================
// 4. ERROR HANDLER GLOBAL
// ============================================

/**
 * Archivo: src/shared/infrastructure/errors/error-handler.ts
 */

import { createLogger } from '../logging/logger';
import { AppError } from '@/shared/domain/errors/AppError';

const logger = createLogger('ErrorHandler');

export function handleError(error: Error | AppError): Response {
  // Log error
  if (error instanceof AppError && error.isOperational) {
    logger.warn({
      msg: 'Operational error',
      code: error.code,
      message: error.message
    });
  } else {
    logger.error({
      msg: 'Unexpected error',
      error: error.message,
      stack: error.stack
    });
  }

  // Enviar a Sentry en producción
  if (process.env.NODE_ENV === 'production' && !isOperational(error)) {
    // Sentry.captureException(error);
  }

  // Respuesta al cliente
  if (error instanceof AppError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error instanceof ValidationError && error.field
            ? { field: error.field }
            : {}),
          ...(error instanceof RateLimitError
            ? { retryAfter: error.retryAfter.toISOString() }
            : {})
        }
      },
      { status: error.statusCode }
    );
  }

  // Error no esperado: no exponer detalles
  return Response.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    },
    { status: 500 }
  );
}

function isOperational(error: Error | AppError): boolean {
  return error instanceof AppError && error.isOperational;
}

// ============================================
// 5. USO EN API ROUTES
// ============================================

/**
 * Archivo: app/api/eventos/route.ts
 */

import { handleError } from '@/shared/infrastructure/errors/error-handler';
import { ValidationError, NotFoundError } from '@/shared/domain/errors/AppError';
import { createLogger } from '@/shared/infrastructure/logging/logger';

const logger = createLogger('EventsAPI');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  logger.info({
    msg: 'Search request',
    query: searchParams.get('q'),
    params: Object.fromEntries(searchParams)
  });

  try {
    // Validación
    const parseResult = SearchQuerySchema.safeParse(/* ... */);
    if (!parseResult.success) {
      throw new ValidationError(
        'Invalid query parameters',
        parseResult.error.issues[0]?.path[0] as string
      );
    }

    // Búsqueda
    const events = await eventService.search(parseResult.data);

    logger.info({
      msg: 'Search completed',
      resultsCount: events.length
    });

    return Response.json({
      data: events,
      total: events.length
    });

  } catch (error) {
    logger.error({
      msg: 'Search failed',
      error: error.message,
      stack: error.stack
    });

    return handleError(error);
  }
}

export async function GET_BY_ID(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const event = await eventService.findById(params.id);

    if (!event) {
      throw new NotFoundError('Event', params.id);
    }

    return Response.json(event);

  } catch (error) {
    return handleError(error);
  }
}

// ============================================
// 6. ERROR BOUNDARIES EN REACT
// ============================================

/**
 * Archivo: src/app/error.tsx (Next.js 14 App Router)
 */

'use client';

import { useEffect } from 'react';
import { createLogger } from '@/shared/infrastructure/logging/logger';

const logger = createLogger('ErrorBoundary');

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({
      msg: 'React error boundary caught error',
      error: error.message,
      digest: error.digest
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Algo salió mal</h2>
      <p className="text-gray-600 mb-4">
        Ocurrió un error inesperado. Por favor, intenta nuevamente.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Reintentar
      </button>
    </div>
  );
}

/**
 * Archivo: src/app/eventos/[id]/error.tsx
 */

'use client';

export default function EventError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-2">Error al cargar evento</h2>
      <p className="text-gray-600 mb-4">
        No pudimos cargar los detalles del evento. Por favor, intenta nuevamente.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Reintentar
      </button>
    </div>
  );
}

// ============================================
// 7. INTEGRACIÓN CON SENTRY (Opcional)
// ============================================

/**
 * Archivo: src/shared/infrastructure/monitoring/sentry.ts
 */

import * as Sentry from '@sentry/nextjs';
import { RateLimitError, ValidationError } from '@/shared/domain/errors/AppError';

if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance monitoring
    tracesSampleRate: 0.1, // 10% de requests

    // Filtrar errores conocidos/esperados
    beforeSend(event, hint) {
      // Ignorar errores de rate limiting (esperados)
      if (hint.originalException instanceof RateLimitError) {
        return null;
      }

      // Ignorar errores de validación (esperados)
      if (hint.originalException instanceof ValidationError) {
        return null;
      }

      return event;
    },

    // No enviar PII
    sendDefaultPii: false
  });
}

/**
 * Capturar errores en scrapers
 */
export function captureScraperError(source: string, error: Error, context?: any) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: {
        scraper: source,
        type: 'scraper_error'
      },
      extra: context
    });
  }
}

// ============================================
// 8. EJEMPLOS DE LOGS ESTRUCTURADOS
// ============================================

/**
 * Scraping exitoso:
 */
/*
{
  "level": "info",
  "module": "DataSourceOrchestrator",
  "msg": "Scraping completed",
  "successful": 4,
  "failed": 1,
  "durationMs": 4200,
  "timestamp": "2025-01-15T14:30:00.000Z"
}
*/

/**
 * Scraper falló:
 */
/*
{
  "level": "error",
  "module": "TicketmasterSource",
  "msg": "Fetch failed after retries",
  "error": "Request timeout",
  "retries": 3,
  "timestamp": "2025-01-15T14:30:05.000Z"
}
*/

/**
 * Búsqueda de usuario:
 */
/*
{
  "level": "info",
  "module": "EventsAPI",
  "msg": "Search request",
  "query": "Metallica",
  "params": { "city": "Buenos Aires", "page": "1" },
  "timestamp": "2025-01-15T14:35:10.000Z"
}
*/

/**
 * Error de validación:
 */
/*
{
  "level": "warn",
  "module": "ErrorHandler",
  "msg": "Operational error",
  "code": "VALIDATION_ERROR",
  "message": "Invalid query parameters",
  "timestamp": "2025-01-15T14:35:15.000Z"
}
*/
