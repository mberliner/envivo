/**
 * IBlacklistRepository
 *
 * Contrato para verificar si eventos están en la lista negra
 * (eventos que el usuario ha marcado como "no mostrar")
 *
 * Clean Architecture: Esta interface pertenece a Domain Layer,
 * pero será implementada en Data Layer (PrismaBlacklistRepository)
 *
 * @module Domain/Interfaces
 */

/**
 * Repositorio para gestionar blacklist de eventos
 */
export interface IBlacklistRepository {
  /**
   * Verifica si un evento está en la blacklist
   * @param source - Fuente del evento (e.g., "livepass", "allaccess")
   * @param externalId - ID externo del evento en la fuente
   * @returns true si está blacklisted, false si no
   */
  isBlacklisted(source: string, externalId: string): Promise<boolean>;

  /**
   * Agrega un evento a la blacklist
   * @param source - Fuente del evento
   * @param externalId - ID externo del evento
   * @param reason - Razón por la cual se blacklisteó
   */
  addToBlacklist(source: string, externalId: string, reason: string): Promise<void>;

  /**
   * Limpia toda la blacklist
   * @returns Número de entradas eliminadas
   */
  clearAll(): Promise<number>;
}
