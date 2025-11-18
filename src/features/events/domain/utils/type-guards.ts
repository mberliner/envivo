/**
 * Type Guards
 *
 * Funciones para verificar capacidades opcionales de data sources
 * en runtime (Interface Segregation Principle en acción)
 *
 * @module Domain/Utils
 */

import {
  IDataSource,
  IHealthCheckable,
  IRateLimited,
  IValidatable,
  IToggleable,
  IConfigurable,
} from '../interfaces/IDataSource';
import { IPreferenceFilter } from '../interfaces/IPreferenceFilter';

/**
 * Verifica si un data source implementa IHealthCheckable
 */
export function isHealthCheckable(source: IDataSource): source is IDataSource & IHealthCheckable {
  return 'healthCheck' in source && typeof source.healthCheck === 'function';
}

/**
 * Verifica si un data source implementa IRateLimited
 */
export function isRateLimited(source: IDataSource): source is IDataSource & IRateLimited {
  return (
    'canFetch' in source &&
    typeof source.canFetch === 'function' &&
    'maxRequestsPerSecond' in source
  );
}

/**
 * Verifica si un data source implementa IValidatable
 */
export function isValidatable(source: IDataSource): source is IDataSource & IValidatable {
  return 'validate' in source && typeof source.validate === 'function';
}

/**
 * Verifica si un data source implementa IToggleable
 */
export function isToggleable(source: IDataSource): source is IDataSource & IToggleable {
  return (
    'enabled' in source &&
    typeof source.enabled === 'boolean' &&
    'enable' in source &&
    'disable' in source
  );
}

/**
 * Verifica si un data source implementa IConfigurable
 */
export function isConfigurable(source: IDataSource): source is IDataSource & IConfigurable {
  return (
    'configure' in source &&
    typeof source.configure === 'function' &&
    'getConfig' in source &&
    typeof source.getConfig === 'function'
  );
}

/**
 * Verifica si un data source implementa IPreferenceFilter
 */
export function isPreferenceFilterable(
  source: IDataSource
): source is IDataSource & IPreferenceFilter {
  return (
    'supportsPrefiltering' in source &&
    typeof source.supportsPrefiltering === 'boolean' &&
    'applyPreferences' in source &&
    typeof source.applyPreferences === 'function'
  );
}
