/**
 * IPreferenceFilter Interface
 *
 * Capacidad opcional para DataSources que soportan pre-filtrado
 * basado en preferencias globales.
 *
 * Sigue el Interface Segregation Principle (ISP): los data sources
 * que no necesitan esta capacidad no están obligados a implementarla.
 *
 * @module Domain/Interfaces
 */

import { GlobalPreferences } from '../entities/GlobalPreferences';

export interface IPreferenceFilter {
  /**
   * Indica si este data source soporta pre-filtrado
   * basado en preferencias.
   *
   * Si es true, el orchestrator llamará a applyPreferences()
   * antes de ejecutar fetch().
   */
  supportsPrefiltering: boolean;

  /**
   * Aplica las preferencias globales al data source.
   *
   * El data source puede usar estas preferencias para:
   * - Filtrar eventos antes de retornarlos
   * - Optimizar queries a APIs externas
   * - Reducir el volumen de datos scrapeados
   *
   * @param preferences - Preferencias globales del sistema
   */
  applyPreferences(preferences: GlobalPreferences): void;
}
