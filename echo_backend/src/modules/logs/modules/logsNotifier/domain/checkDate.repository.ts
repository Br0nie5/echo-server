import type { LastCheckDate } from './lastCheckDate.js'

/**
 * Storage of the date the logs were last checked at.
 *
 * The domain only states what it needs from the storage: the `infra` folder holds the
 * implementations.
 *
 * ```ts
 * const lastCheckDate = await checkDateRepository.getLastCheckDate()
 * await checkDateRepository.saveLastCheckDate({ lastCheckDate: new Date() })
 * ```
 */
export interface CheckDateRepository {
  /** The stored date, or `undefined` when none is stored yet or when what is stored is not a date. */
  getLastCheckDate: () => Promise<LastCheckDate | undefined>
  /** Stores `lastCheckDate`, replacing the one stored before. */
  saveLastCheckDate: (lastCheckDate: LastCheckDate) => Promise<void>
}
