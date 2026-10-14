import { createLogId, type Log } from '@echo/utilities'

/**
 * Builds a log of the `send_invoices` script, at INFO level, with its `id` made by `createLogId`.
 *
 * `overrides` replaces any field but the `id`. `idNumber` tells apart the logs whose fields are the
 * same, as their position where they are stored does: 0 when left out.
 *
 * ```ts
 * const errorLog = buildLog({ level: 'ERROR', message: 'quota is reached' })
 * const logs = [buildLog({}, 0), buildLog({}, 1)]
 * ```
 */
export const buildLog = (overrides: Partial<Omit<Log, 'id'>> = {}, idNumber = 0): Log => {
  const noIdLog: Omit<Log, 'id'> = {
    date: '2026-01-02T10:00:00.000Z',
    jobId: 1,
    level: 'INFO',
    location: '/storage/send_invoices',
    locationName: 'send_invoices',
    message: 'message',
    origin: 'send_invoices.sh:12',
    ...overrides
  }

  return { ...noIdLog, id: createLogId(noIdLog, idNumber) }
}
