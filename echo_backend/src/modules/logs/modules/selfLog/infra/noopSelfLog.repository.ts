import type { SelfLogRepository } from '../domain/selfLog.repository.js'

/**
 * Builds a `SelfLogRepository` that stores nothing.
 *
 * It is what the backend logs through when the self logs are disabled, or when their storage could
 * not be prepared, so nobody has to check whether self logs are on before logging.
 */
export const createNoopSelfLogRepository = (): SelfLogRepository => ({
  saveSelfLogs: async (): Promise<void> => {}
})
