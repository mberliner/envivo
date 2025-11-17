/**
 * DataSourceOrchestrator
 *
 * Orquesta la ejecución paralela de múltiples data sources.
 *
 * Responsabilidades:
 * - Ejecutar múltiples sources en paralelo (Promise.allSettled)
 * - Manejar errores gracefully (si un source falla, los demás continúan)
 * - Integrar con EventService para procesamiento/validación/deduplicación
 * - Retornar resultados estructurados por fuente
 *
 * @module Data/Orchestrator
 */

import type { IDataSource } from '@/features/events/domain/interfaces/IDataSource';
import type { IEventRepository } from '@/features/events/domain/interfaces/IEventRepository';
import type { RawEvent } from '@/features/events/domain/entities/Event';
import { EventService } from '@/features/events/domain/services/EventService';
import {
  EventBusinessRules,
  DEFAULT_BUSINESS_RULES,
} from '@/features/events/domain/services/EventBusinessRules';
import { PreferencesService } from '@/features/events/domain/services/PreferencesService';
import { PrismaPreferencesRepository } from '@/features/events/data/repositories/PrismaPreferencesRepository';
import { prisma } from '@/shared/infrastructure/database/prisma';

/**
 * Resultado de la ejecución de un data source individual
 */
export interface SourceResult {
  /** Nombre del data source */
  name: string;
  /** Si la ejecución fue exitosa */
  success: boolean;
  /** Cantidad de eventos obtenidos */
  eventsCount: number;
  /** Duración del fetch en ms */
  duration: number;
  /** Error si falló */
  error?: string;
}

/**
 * Resultado agregado de la ejecución de todos los sources
 */
export interface OrchestratorResult {
  /** Resultados por source */
  sources: SourceResult[];
  /** Total de eventos scrapeados */
  totalEvents: number;
  /** Total de eventos procesados (aceptados) */
  totalProcessed: number;
  /** Total de duplicados detectados */
  totalDuplicates: number;
  /** Total de errores durante procesamiento */
  totalErrors: number;
  /** Detalle de errores */
  errors: Array<{ event: RawEvent; reason: string }>;
  /** Duración total en ms */
  duration: number;
  /** Timestamp de ejecución */
  timestamp: Date;
}

/**
 * Orchestrador de data sources
 */
export class DataSourceOrchestrator {
  private sources: IDataSource[] = [];
  private eventService: EventService;

  constructor(private readonly repository: IEventRepository) {
    const preferencesRepository = new PrismaPreferencesRepository(prisma);
    const preferencesService = new PreferencesService(preferencesRepository);
    const businessRules = new EventBusinessRules(DEFAULT_BUSINESS_RULES, preferencesService);
    this.eventService = new EventService(repository, businessRules);
  }

  /**
   * Registra un data source
   * No permite duplicados (mismo name)
   */
  registerSource(source: IDataSource): void {
    // Evitar duplicados
    if (!this.sources.find((s) => s.name === source.name)) {
      this.sources.push(source);
    }
  }

  /**
   * Obtiene la lista de sources registrados
   */
  getSources(): IDataSource[] {
    return [...this.sources]; // Copia defensiva
  }

  /**
   * Elimina todos los sources registrados
   */
  clearSources(): void {
    this.sources = [];
  }

  /**
   * Ejecuta todos los data sources en paralelo
   *
   * Usa Promise.allSettled para que el fallo de un source
   * no detenga la ejecución de los demás.
   *
   * @returns Resultado agregado con información de cada source
   */
  async fetchAll(): Promise<OrchestratorResult> {
    const startTime = Date.now();

    // Ejecutar todos los sources en paralelo
    const sourcePromises = this.sources.map(async (source) => {
      const sourceStartTime = Date.now();

      try {
        const events = await source.fetch();
        const duration = Date.now() - sourceStartTime;

        return {
          name: source.name,
          success: true,
          eventsCount: events.length,
          duration,
          events, // Mantener eventos para procesamiento posterior
        };
      } catch (error) {
        const duration = Date.now() - sourceStartTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return {
          name: source.name,
          success: false,
          eventsCount: 0,
          duration,
          error: errorMessage,
          events: [] as RawEvent[],
        };
      }
    });

    // Esperar a que todos terminen (settled)
    const settledResults = await Promise.allSettled(sourcePromises);

    // Extraer resultados exitosos
    const sourceResults: SourceResult[] = [];
    const allEvents: RawEvent[] = [];

    for (const settled of settledResults) {
      if (settled.status === 'fulfilled') {
        const { events, ...sourceResult } = settled.value;
        sourceResults.push(sourceResult);

        if (settled.value.success) {
          allEvents.push(...events);
        }
      } else {
        // Promise rechazada (no debería ocurrir con try/catch interno)
        sourceResults.push({
          name: 'unknown',
          success: false,
          eventsCount: 0,
          duration: 0,
          error: settled.reason?.message || 'Promise rejected',
        });
      }
    }

    // Procesar eventos con EventService (validación, deduplicación, inserción)
    let totalProcessed = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;
    let errors: Array<{ event: RawEvent; reason: string }> = [];

    if (allEvents.length > 0) {
      const processResult = await this.eventService.processEvents(allEvents);
      totalProcessed = processResult.accepted + processResult.updated;
      totalDuplicates = processResult.duplicates;
      totalErrors = processResult.errors.length;
      errors = processResult.errors;
    }

    const totalDuration = Date.now() - startTime;

    return {
      sources: sourceResults,
      totalEvents: allEvents.length,
      totalProcessed,
      totalDuplicates,
      totalErrors,
      errors,
      duration: totalDuration,
      timestamp: new Date(),
    };
  }
}
