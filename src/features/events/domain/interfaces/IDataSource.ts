/**
 * IDataSource Interface
 *
 * Interface base que todos los data sources deben implementar.
 * Define el contrato mínimo para obtener eventos de cualquier fuente.
 *
 * @module Domain/Interfaces
 */

import { RawEvent } from '../entities/Event';

export interface IDataSource {
  /**
   * Nombre identificador del data source
   * Ejemplo: "ticketmaster", "eventbrite", "scraper_local_teatro_colon"
   */
  name: string;

  /**
   * Tipo de data source
   * - api: Consume API REST/GraphQL
   * - web: Scraper web genérico (HTML/CSS)
   * - scraper: Extrae datos de HTML (legacy)
   * - file: Lee archivo local/remoto
   */
  type: 'api' | 'web' | 'scraper' | 'file';

  /**
   * Obtiene eventos de la fuente de datos
   * @returns Array de eventos sin procesar
   * @throws Error si la obtención falla
   */
  fetch(): Promise<RawEvent[]>;
}

/**
 * Resultado de un health check
 */
export interface HealthCheckResult {
  healthy: boolean;
  message?: string;
  latency?: number; // en ms
}

/**
 * Capacidad opcional: Health Check
 */
export interface IHealthCheckable {
  healthCheck(): Promise<HealthCheckResult>;
}

/**
 * Capacidad opcional: Rate Limiting
 */
export interface IRateLimited {
  canFetch(): boolean;
  maxRequestsPerSecond: number;
}

/**
 * Capacidad opcional: Validación de eventos
 */
export interface IValidatable {
  validate(event: RawEvent): boolean;
}

/**
 * Capacidad opcional: Habilitación/deshabilitación
 */
export interface IToggleable {
  enabled: boolean;
  enable(): void;
  disable(): void;
}

/**
 * Capacidad opcional: Configuración
 */
export interface IConfigurable<T = any> {
  configure(config: T): void;
  getConfig(): T;
}
