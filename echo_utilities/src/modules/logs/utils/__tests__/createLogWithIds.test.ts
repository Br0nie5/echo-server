import { describe, it, expect } from 'vitest'

import type { Log } from '../../schemas/log.schema.js'
import { LogLevel } from '../../schemas/logLevel.schema.js'
import { createLogContentId } from '../createLogContentId.js'
import { createLogId } from '../createLogId.js'
import { createLogWithIds } from '../createLogWithIds.js'

const noIdsLog: Omit<Log, 'id' | 'contentId'> = {
  date: '2026-04-28T10:00:00.000Z',
  groupName: 'billing',
  location: '/storage/send_invoices',
  locationName: 'send_invoices',
  jobId: 66,
  level: LogLevel.WARNING,
  message: 'Quota almost reached',
  origin: 'send_invoices.sh:12'
}

describe('createLogWithIds', () => {
  it('Should give the log with its id, made with the id number, and its contentId', () => {
    expect(createLogWithIds(noIdsLog, 3)).toEqual({
      ...noIdsLog,
      id: createLogId(noIdsLog, 3),
      contentId: createLogContentId(noIdsLog)
    })
  })
})
