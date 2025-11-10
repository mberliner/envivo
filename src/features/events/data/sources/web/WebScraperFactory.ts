/**
 * Web Scraper Factory
 *
 * Factory para crear scrapers web usando configuraciones.
 * Permite agregar nuevos sitios sin modificar código, solo agregando configs.
 */

import { IDataSource } from '@/features/events/domain/interfaces/IDataSource';
import { GenericWebScraper } from './GenericWebScraper';
import { ScraperConfig } from './types/ScraperConfig';

/**
 * Registry de configuraciones de scrapers disponibles
 */
const SCRAPER_CONFIGS: Record<string, () => Promise<ScraperConfig>> = {
  livepass: async () => {
    const { livepassConfig } = await import('@/config/scrapers/livepass.config');
    return livepassConfig;
  },
  // Agregar más scrapers aquí:
  // alternativa: async () => {
  //   const { alternativaConfig } = await import('@/config/scrapers/alternativa.config');
  //   return alternativaConfig;
  // },
};

/**
 * Web Scraper Factory
 *
 * Crea instancias de GenericWebScraper basadas en configuraciones.
 *
 * @example
 * ```typescript
 * // Crear scraper de LivePass
 * const livepassScraper = await WebScraperFactory.create('livepass');
 *
 * // Usar con orchestrator
 * orchestrator.registerSource(await WebScraperFactory.create('livepass'));
 * orchestrator.registerSource(await WebScraperFactory.create('alternativa'));
 * ```
 */
export class WebScraperFactory {
  /**
   * Crea un scraper web por nombre
   *
   * @param scraperName - Nombre del scraper (debe existir en SCRAPER_CONFIGS)
   * @returns Instancia de GenericWebScraper
   * @throws Error si el scraper no existe
   */
  static async create(scraperName: string): Promise<IDataSource> {
    const configLoader = SCRAPER_CONFIGS[scraperName];

    if (!configLoader) {
      throw new Error(
        `Unknown web scraper: ${scraperName}. Available scrapers: ${this.getAvailableScrapers().join(', ')}`
      );
    }

    const config = await configLoader();
    return new GenericWebScraper(config);
  }

  /**
   * Crea múltiples scrapers de una vez
   *
   * @param scraperNames - Array de nombres de scrapers
   * @returns Array de GenericWebScraper instances
   *
   * @example
   * ```typescript
   * const scrapers = await WebScraperFactory.createMany(['livepass', 'alternativa']);
   * scrapers.forEach(scraper => orchestrator.registerSource(scraper));
   * ```
   */
  static async createMany(scraperNames: string[]): Promise<IDataSource[]> {
    return Promise.all(scraperNames.map((name) => this.create(name)));
  }

  /**
   * Crea TODOS los scrapers disponibles
   *
   * @returns Array con todos los scrapers configurados
   *
   * @example
   * ```typescript
   * const allScrapers = await WebScraperFactory.createAll();
   * allScrapers.forEach(scraper => orchestrator.registerSource(scraper));
   * ```
   */
  static async createAll(): Promise<IDataSource[]> {
    return this.createMany(this.getAvailableScrapers());
  }

  /**
   * Lista de scrapers disponibles
   *
   * @returns Array de nombres de scrapers configurados
   */
  static getAvailableScrapers(): string[] {
    return Object.keys(SCRAPER_CONFIGS);
  }

  /**
   * Verifica si un scraper existe
   *
   * @param scraperName - Nombre del scraper
   * @returns true si existe la config
   */
  static isAvailable(scraperName: string): boolean {
    return scraperName in SCRAPER_CONFIGS;
  }

  /**
   * Registra un nuevo scraper config dinámicamente
   *
   * Útil para testing o para agregar configs en runtime.
   *
   * @param scraperName - Nombre único del scraper
   * @param config - Configuración del scraper
   *
   * @example
   * ```typescript
   * WebScraperFactory.register('test-scraper', {
   *   name: 'test-scraper',
   *   type: 'web',
   *   baseUrl: 'https://example.com',
   *   // ... resto de config
   * });
   * ```
   */
  static register(scraperName: string, config: ScraperConfig): void {
    if (this.isAvailable(scraperName)) {
      console.warn(`Scraper ${scraperName} already exists. Overwriting.`);
    }

    SCRAPER_CONFIGS[scraperName] = async () => config;
  }

  /**
   * Desregistra un scraper
   *
   * @param scraperName - Nombre del scraper a remover
   */
  static unregister(scraperName: string): void {
    delete SCRAPER_CONFIGS[scraperName];
  }
}
