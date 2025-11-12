/**
 * EJEMPLO COMPLETO: Implementación de Scraping Asíncrono
 *
 * Este archivo muestra cómo implementar:
 * 1. Interfaces segregadas (ISP)
 * 2. DataSourceOrchestrator con async scraping
 * 3. ExternalApiSource (API client con todas las capacidades)
 * 4. LocalVenueScraper (scraper básico)
 *
 * NOTA: Este es un archivo de EJEMPLO. Copiar código a /src durante implementación.
 * NOTA: Para Argentina, APIs recomendadas: AllAccess, EventBrite Argentina, LivePass
 */

import pLimit from 'p-limit';
import pRetry from 'p-retry';
import axios from 'axios';
import cheerio from 'cheerio';

// ============================================
// INTERFACES SEGREGADAS (ISP)
// ============================================

/**
 * Interface base - TODOS implementan esto
 */
export interface IDataSource {
  readonly name: string;
  readonly type: 'api' | 'scraper' | 'file';
  fetch(params?: FetchParams): Promise<RawEvent[]>;
}

/**
 * Capacidad: Health check
 * SOLO APIs externas implementan esto
 */
export interface IHealthCheckable {
  healthCheck(): Promise<HealthCheckResult>;
}

/**
 * Capacidad: Rate limiting
 * SOLO fuentes con límites de requests
 */
export interface IRateLimited {
  readonly maxRequestsPerSecond: number;
  readonly maxRequestsPerDay?: number;
  canFetch(): boolean;
}

/**
 * Capacidad: Validación de datos
 * Fuentes que necesitan validar antes de retornar
 */
export interface IValidatable {
  validate(event: RawEvent): boolean;
}

/**
 * Capacidad: Enable/Disable
 * Fuentes que pueden deshabilitarse dinámicamente
 */
export interface IToggleable {
  readonly enabled: boolean;
  enable(): void;
  disable(): void;
}

/**
 * Capacidad: Configuración dinámica
 */
export interface IConfigurable<T = any> {
  configure(config: T): void;
  getConfig(): T;
}

// ============================================
// TYPE GUARDS
// ============================================

function isHealthCheckable(source: IDataSource): source is IDataSource & IHealthCheckable {
  return 'healthCheck' in source;
}

function isRateLimited(source: IDataSource): source is IDataSource & IRateLimited {
  return 'canFetch' in source;
}

function isValidatable(source: IDataSource): source is IDataSource & IValidatable {
  return 'validate' in source;
}

function isToggleable(source: IDataSource): source is IDataSource & IToggleable {
  return 'enabled' in source;
}

// ============================================
// TYPES
// ============================================

interface RawEvent {
  title: string;
  date: string;
  venue?: string;
  city?: string;
  country?: string;
  description?: string;
  imageUrl?: string;
  ticketUrl?: string;
  price?: number;
}

interface FetchParams {
  city?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface HealthCheckResult {
  healthy: boolean;
  latency?: number;
  error?: string;
  timestamp: Date;
}

interface SourceResult {
  source: string;
  events: RawEvent[];
  success: boolean;
  error?: string;
  duration: number;
}

interface OrchestratorResult {
  sources: SourceResult[];
  totalEvents: number;
  successful: number;
  failed: number;
  duration: number;
  events: RawEvent[];
}

interface OrchestrationOptions {
  concurrency?: number;
  retries?: number;
  timeout?: number;
}

// ============================================
// ORCHESTRATOR (Core)
// ============================================

export class DataSourceOrchestrator {
  private sources: Map<string, IDataSource> = new Map();

  /**
   * Registra una nueva fuente de datos
   */
  register(source: IDataSource): void {
    this.sources.set(source.name, source);
  }

  /**
   * Ejecuta todas las fuentes en paralelo con límite de concurrencia
   */
  async fetchAll(options?: OrchestrationOptions): Promise<OrchestratorResult> {
    const concurrency = options?.concurrency || 5;
    const retries = options?.retries || 3;
    const limit = pLimit(concurrency);

    const startTime = Date.now();

    // Filtrar fuentes habilitadas
    const activeSources = Array.from(this.sources.values()).filter(source => {
      if (isToggleable(source)) {
        return source.enabled;
      }
      return true; // Si no es toggleable, está habilitada por defecto
    });

    console.log(`📊 Starting scraping: ${activeSources.length} active sources`);

    // Ejecutar con límite de concurrencia
    const results = await Promise.allSettled(
      activeSources.map(source =>
        limit(() => this.fetchWithRetry(source, retries))
      )
    );

    return this.aggregateResults(results, Date.now() - startTime);
  }

  /**
   * Ejecuta una fuente con retry logic y exponential backoff
   */
  private async fetchWithRetry(
    source: IDataSource,
    retries: number
  ): Promise<SourceResult> {
    const startTime = Date.now();

    try {
      // 1. Health check opcional (solo para fuentes externas)
      if (isHealthCheckable(source)) {
        const health = await source.healthCheck();
        if (!health.healthy) {
          throw new Error(`Health check failed: ${health.error}`);
        }
      }

      // 2. Verificar rate limiting opcional
      if (isRateLimited(source)) {
        if (!source.canFetch()) {
          throw new Error('Rate limit exceeded');
        }
      }

      // 3. Fetch con retry
      const events = await pRetry(
        async () => {
          const data = await source.fetch();

          // Validar si la fuente soporta validación
          if (isValidatable(source)) {
            const validEvents = data.filter(e => source.validate(e));

            if (validEvents.length === 0 && data.length > 0) {
              console.warn(`[${source.name}] All ${data.length} events failed validation`);
            }

            return validEvents;
          }

          // Sin validación, retornar todos
          if (!data || data.length === 0) {
            throw new Error('No data returned');
          }

          return data;
        },
        {
          retries,
          onFailedAttempt: (error) => {
            console.log(
              `[${source.name}] Attempt ${error.attemptNumber} failed. ` +
              `${error.retriesLeft} retries left.`
            );
          },
          // Exponential backoff: 1s, 2s, 4s, 8s
          minTimeout: 1000,
          factor: 2
        }
      );

      console.log(`✅ [${source.name}] ${events.length} events (${Date.now() - startTime}ms)`);

      return {
        source: source.name,
        events,
        success: true,
        duration: Date.now() - startTime
      };

    } catch (error) {
      console.error(`❌ [${source.name}] Failed after ${retries} retries:`, error.message);

      return {
        source: source.name,
        events: [],
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Agrega resultados de todas las fuentes
   */
  private aggregateResults(
    results: PromiseSettledResult<SourceResult>[],
    totalDuration: number
  ): OrchestratorResult {
    const processed: SourceResult[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        processed.push(result.value);
      } else {
        // Promise rechazado (timeout, error no manejado)
        processed.push({
          source: 'unknown',
          events: [],
          success: false,
          error: result.reason.message,
          duration: 0
        });
      }
    }

    const allEvents = processed
      .filter(r => r.success)
      .flatMap(r => r.events);

    const successful = processed.filter(r => r.success).length;
    const failed = processed.filter(r => !r.success).length;

    // Log resumen
    console.log(`\n📊 Scraping Summary:`);
    console.log(`   ✅ Successful: ${successful}/${results.length}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📅 Total events: ${allEvents.length}`);
    console.log(`   ⏱️  Duration: ${totalDuration}ms`);

    return {
      sources: processed,
      totalEvents: allEvents.length,
      successful,
      failed,
      duration: totalDuration,
      events: allEvents
    };
  }
}

// ============================================
// EJEMPLO 1: API EXTERNA (EventBrite Argentina / AllAccess)
// Implementa TODAS las capacidades
// ============================================

interface ExternalApiConfig {
  apiKey: string;
  countryCode: string;
  timeout: number;
}

class RateLimiter {
  private lastCallTime = 0;
  private callCount = 0;

  constructor(private maxRequestsPerSecond: number) {}

  canProceed(): boolean {
    const now = Date.now();
    const elapsed = now - this.lastCallTime;

    // Reset counter cada segundo
    if (elapsed >= 1000) {
      this.callCount = 0;
      this.lastCallTime = now;
      return true;
    }

    // Verificar si no excede límite
    if (this.callCount < this.maxRequestsPerSecond) {
      this.callCount++;
      return true;
    }

    return false;
  }
}

export class ExternalApiSource implements
  IDataSource,
  IHealthCheckable,
  IRateLimited,
  IValidatable,
  IToggleable,
  IConfigurable<ExternalApiConfig> {

  readonly name = 'external_api';
  readonly type = 'api' as const;
  readonly maxRequestsPerSecond = 5;
  readonly maxRequestsPerDay = 5000;

  private _enabled = true;
  private config: ExternalApiConfig;
  private rateLimiter: RateLimiter;

  constructor(name: string, config: ExternalApiConfig) {
    this.name = name;
    this.config = config;
    this.rateLimiter = new RateLimiter(this.maxRequestsPerSecond);
  }

  // IDataSource
  async fetch(params?: FetchParams): Promise<RawEvent[]> {
    if (!this.canFetch()) {
      throw new Error('Rate limit exceeded');
    }

    // Ejemplo genérico - adaptar según la API específica
    const response = await axios.get('https://api.example.com/events', {
      params: {
        apikey: this.config.apiKey,
        country: this.config.countryCode,
        ...params
      },
      timeout: this.config.timeout
    });

    const events = response.data.events || [];

    return events.map((e: any) => ({
      title: e.name || e.title,
      date: e.startDate || e.date,
      venue: e.venue?.name,
      city: e.venue?.city,
      country: e.venue?.country,
      description: e.description,
      imageUrl: e.image?.url,
      ticketUrl: e.url,
      price: e.pricing?.min
    }));
  }

  // IValidatable
  validate(event: RawEvent): boolean {
    return !!(event.title && event.date && event.venue);
  }

  // IHealthCheckable
  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      await axios.get('https://api.example.com/health', {
        params: { apikey: this.config.apiKey },
        timeout: 5000
      });

      return {
        healthy: true,
        latency: Date.now() - start,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // IRateLimited
  canFetch(): boolean {
    return this.rateLimiter.canProceed();
  }

  // IConfigurable
  configure(config: Partial<ExternalApiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ExternalApiConfig {
    return { ...this.config };
  }

  // IToggleable
  get enabled(): boolean {
    return this._enabled;
  }

  enable(): void {
    this._enabled = true;
  }

  disable(): void {
    this._enabled = false;
  }
}

// ============================================
// EJEMPLO 2: WEB SCRAPER (Sitio Local)
// Implementa SOLO lo necesario
// ============================================

interface ScraperConfig {
  url: string;
  selectors: Record<string, string>;
  timeout: number;
}

export class LocalVenueScraper implements
  IDataSource,
  IValidatable,
  IConfigurable<ScraperConfig> {

  readonly name: string;
  readonly type = 'scraper' as const;

  private config: ScraperConfig;

  constructor(name: string, config: ScraperConfig) {
    this.name = name;
    this.config = config;
  }

  // IDataSource
  async fetch(): Promise<RawEvent[]> {
    const { data: html } = await axios.get(this.config.url, {
      timeout: this.config.timeout
    });

    const $ = cheerio.load(html);
    const events: RawEvent[] = [];

    $('.event-item').each((_, el) => {
      const $el = $(el);
      events.push({
        title: $el.find(this.config.selectors.title).text().trim(),
        date: $el.find(this.config.selectors.date).text().trim(),
        venue: $el.find(this.config.selectors.venue).text().trim(),
        city: $el.find(this.config.selectors.city).text().trim(),
        imageUrl: $el.find(this.config.selectors.image).attr('src'),
        ticketUrl: $el.find(this.config.selectors.link).attr('href')
      });
    });

    return events;
  }

  // IValidatable
  validate(event: RawEvent): boolean {
    // Validación básica
    return !!(event.title && event.date);
  }

  // IConfigurable
  configure(config: Partial<ScraperConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ScraperConfig {
    return { ...this.config };
  }

  // ✅ NO implementa healthCheck() - no lo necesita
  // ✅ NO implementa canFetch() - no tiene rate limits
}

// ============================================
// EJEMPLO 3: ARCHIVO LOCAL
// Implementa MÍNIMO
// ============================================

export class LocalFileSource implements IDataSource {
  readonly name: string;
  readonly type = 'file' as const;

  constructor(name: string, private filePath: string) {
    this.name = name;
  }

  // IDataSource - ÚNICA implementación requerida
  async fetch(): Promise<RawEvent[]> {
    const fs = require('fs').promises;
    const fileContent = await fs.readFile(this.filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.events || [];
  }

  // ✅ Limpio: Sin métodos innecesarios
}

// ============================================
// USO COMPLETO
// ============================================

async function main() {
  const orchestrator = new DataSourceOrchestrator();

  // Registrar fuentes
  // Ejemplo: AllAccess Argentina
  orchestrator.register(new ExternalApiSource('allaccess', {
    apiKey: process.env.ALLACCESS_API_KEY!,
    countryCode: 'AR',
    timeout: 10000
  }));

  // Ejemplo: Scraper de venue local
  orchestrator.register(new LocalVenueScraper('teatro-colon', {
    url: 'https://teatrocolon.org.ar/eventos',
    timeout: 15000,
    selectors: {
      title: '.event-title',
      date: '.event-date',
      venue: '.event-venue',
      city: '.event-city',
      image: '.event-img',
      link: '.event-link'
    }
  }));

  orchestrator.register(new LocalFileSource('local-events', './events.json'));

  // Ejecutar scraping
  const result = await orchestrator.fetchAll({
    concurrency: 5,
    retries: 3,
    timeout: 30000
  });

  console.log('Result:', result);
}

// main().catch(console.error);

// ============================================
// UTILITY: TIMEOUT WRAPPER
// ============================================

/**
 * Envuelve una promesa con un timeout
 *
 * @example
 * const result = await withTimeout(
 *   fetch('https://slow-api.com'),
 *   5000,
 *   'API request timed out'
 * );
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );

  return Promise.race([promise, timeoutPromise]);
}

// Ejemplo de uso:
// const events = await withTimeout(
//   scraper.fetch(),
//   15000,
//   'Scraper timeout after 15s'
// );
