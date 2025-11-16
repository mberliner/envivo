/**
 * Web Scraper Configuration Types
 *
 * Define la estructura de configuración para scrapers web genéricos.
 * Diseñado para ser simple pero extensible.
 */

/**
 * Tipo de paginación soportado
 */
export type PaginationType = 'none' | 'url' | 'infinite-scroll';

/**
 * Configuración de paginación
 */
export interface PaginationConfig {
  /** Tipo de paginación */
  type: PaginationType;
  /** Patrón de URL para paginación (ej: '/events/page/{page}') */
  pattern?: string;
  /** Selector del botón "siguiente" (alternativa a pattern) */
  nextButtonSelector?: string;
  /** Número máximo de páginas a scrapear */
  maxPages?: number;
  /** Delay entre páginas (ms) */
  delayBetweenPages?: number;
}

/**
 * Selectores CSS para extraer datos de eventos
 * Los selectores pueden ser undefined si se usan defaultValues
 */
export interface EventSelectors {
  /** Selector del título del evento */
  title?: string;
  /** Selector de la fecha/hora */
  date?: string;
  /** Selector de la hora específica (HH:MM) */
  time?: string;
  /** Selector del venue/lugar */
  venue?: string;
  /** Selector de la ciudad */
  city?: string;
  /** Selector del país */
  country?: string;
  /** Selector de la dirección */
  address?: string;
  /** Selector del precio */
  price?: string;
  /** Selector de la imagen */
  image?: string;
  /** Selector del link a más detalles */
  link?: string;
  /** Selector de la categoría/género */
  category?: string;
  /** Selector de la descripción */
  description?: string;
}

/**
 * Valores por defecto para campos sin selector
 * Útil para sitios donde algunos campos están hardcodeados
 */
export interface DefaultValues {
  /** Título por defecto (si no hay selector) */
  title?: string;
  /** Fecha por defecto (si no hay selector) */
  date?: string;
  /** Venue por defecto (si no hay selector) */
  venue?: string;
  /** Ciudad por defecto (si no hay selector) */
  city?: string;
  /** País por defecto (si no hay selector) */
  country?: string;
  /** Dirección por defecto (si no hay selector) */
  address?: string;
  /** Categoría por defecto (si no hay selector) */
  category?: string;
}

/**
 * Configuración de un listado de eventos
 */
export interface ListingConfig {
  /** URL del listado (relativa a baseUrl) */
  url: string;
  /** Selector del contenedor de eventos */
  containerSelector?: string;
  /** Selector de cada item/evento individual */
  itemSelector: string;
  /** Configuración de paginación */
  pagination?: PaginationConfig;
}

/**
 * Configuración de página de detalles
 * Para scrapers que necesitan obtener información adicional
 * de una página separada por cada evento
 */
export interface DetailPageConfig {
  /** Si está habilitado el scraping de detalles */
  enabled: boolean;
  /** Selectores específicos para la página de detalles */
  selectors: EventSelectors;
  /** Valores por defecto específicos para detalles */
  defaultValues?: DefaultValues;
  /** Transformaciones específicas para campos de detalles */
  transforms?: TransformFunctions;
  /** Delay entre requests de detalles (ms) - default 500ms */
  delayBetweenRequests?: number;
  /** Timeout para cada página de detalles (ms) - default 30000ms */
  timeout?: number;
  /**
   * Selector CSS que debe aparecer después de que JS cargue el contenido de la página de detalles
   * Solo se usa si requiresJavaScript = true
   * El scraper esperará a que este selector esté visible antes de extraer datos
   */
  waitForSelector?: string;
  /**
   * Timeout máximo para esperar que JS cargue el contenido de la página de detalles (ms)
   * Solo se usa si requiresJavaScript = true
   * Default: 30000 (30 segundos)
   */
  waitForTimeout?: number;
}

/**
 * Funciones de transformación para campos extraídos
 * Las keys deben coincidir con las keys de EventSelectors
 */
export type TransformFunctions = {
  [K in keyof EventSelectors]?: string; // Nombre de la función en transforms.ts
};

/**
 * Configuración de rate limiting
 */
export interface RateLimitConfig {
  /** Requests por segundo */
  requestsPerSecond: number;
  /** Timeout por request (ms) */
  timeout?: number;
}

/**
 * Configuración de retry
 */
export interface RetryConfig {
  /** Número máximo de reintentos */
  maxRetries: number;
  /** Delay inicial (ms) */
  initialDelay: number;
  /** Multiplicador para exponential backoff */
  backoffMultiplier: number;
}

/**
 * Configuración de manejo de errores
 */
export interface ErrorHandlingConfig {
  /** Continuar si un evento individual falla */
  skipFailedEvents?: boolean;
  /** Continuar si una página falla */
  skipFailedPages?: boolean;
  /** Configuración de retry */
  retry?: RetryConfig;
  /** Timeout por request (ms) */
  timeout?: number;
}

/**
 * Configuración completa de un scraper web
 */
export interface ScraperConfig {
  /** Nombre único del scraper */
  name: string;
  /** Tipo de fuente (siempre 'web' para scrapers) */
  type: 'web';
  /** URL base del sitio */
  baseUrl: string;
  /** Configuración del listado de eventos */
  listing: ListingConfig;
  /** Selectores CSS para extraer datos del listado */
  selectors: EventSelectors;
  /** Valores por defecto para campos sin selector */
  defaultValues?: DefaultValues;
  /** Funciones de transformación (nombre de función en transforms.ts) */
  transforms?: TransformFunctions;
  /** Configuración de página de detalles (opcional) */
  detailPage?: DetailPageConfig;
  /** Rate limiting */
  rateLimit?: RateLimitConfig;
  /** Manejo de errores */
  errorHandling?: ErrorHandlingConfig;
  /** User-Agent personalizado (opcional) */
  userAgent?: string;
  /** Headers HTTP adicionales */
  headers?: Record<string, string>;
  /**
   * Si requiere JavaScript para renderizar contenido (Blazor, React, Vue, etc.)
   * Si true, se usará PuppeteerWebScraper en lugar de GenericWebScraper
   * Default: false
   */
  requiresJavaScript?: boolean;
  /**
   * Selector CSS que debe aparecer después de que JS cargue el contenido
   * Solo se usa si requiresJavaScript = true
   * El scraper esperará a que este selector esté visible antes de extraer datos
   */
  waitForSelector?: string;
  /**
   * Timeout máximo para esperar que JS cargue el contenido (ms)
   * Solo se usa si requiresJavaScript = true
   * Default: 30000 (30 segundos)
   */
  waitForTimeout?: number;
}

/**
 * Configuración por defecto para scrapers
 */
export const DEFAULT_SCRAPER_CONFIG: Partial<ScraperConfig> = {
  type: 'web',
  rateLimit: {
    requestsPerSecond: 1, // Conservador: 1 request/segundo
    timeout: 15000, // 15 segundos
  },
  errorHandling: {
    skipFailedEvents: true, // Continuar si un evento falla
    skipFailedPages: false, // Fallar si una página completa falla
    retry: {
      maxRetries: 3,
      initialDelay: 1000, // 1 segundo
      backoffMultiplier: 2, // 1s, 2s, 4s
    },
    timeout: 15000,
  },
  userAgent: 'EnVivoBot/1.0 (+https://envivo.ar/bot)',
};
