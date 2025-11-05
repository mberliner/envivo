/**
 * IPreferencesRepository Interface
 *
 * Define el contrato para acceder y manipular las preferencias globales
 * del sistema.
 *
 * @module Domain/Interfaces
 */

import { GlobalPreferences } from '../entities/GlobalPreferences';

export interface IPreferencesRepository {
  /**
   * Obtiene las preferencias globales actuales
   * @returns Las preferencias o null si no existen
   */
  get(): Promise<GlobalPreferences | null>;

  /**
   * Crea o actualiza las preferencias globales
   * @param preferences - Preferencias a guardar (parcial o completo)
   */
  update(preferences: Partial<GlobalPreferences>): Promise<GlobalPreferences>;

  /**
   * Verifica si se necesita re-scraping
   * @returns true si needsRescraping es true
   */
  needsRescraping(): Promise<boolean>;

  /**
   * Marca que el re-scraping fue completado
   * Establece needsRescraping = false
   */
  markRescrapingDone(): Promise<void>;

  /**
   * Inicializa las preferencias con valores por defecto si no existen
   * @returns Las preferencias inicializadas
   */
  initialize(): Promise<GlobalPreferences>;
}
