import { describe, it, expect } from 'vitest'

import type { Log } from '../../schemas/log.schema.js'
import { LogLevel } from '../../schemas/logLevel.schema.js'
import { createLogContentId } from '../createLogContentId.js'

const log: Omit<Log, 'id' | 'contentId'> = {
  date: '2026-04-28T10:00:00.000Z',
  groupName: 'docker_utils',
  location: '/server/docker_utils/log/backup.jsonl',
  locationName: 'backup',
  jobId: 66,
  level: LogLevel.WARNING,
  message: 'Disk almost full',
  origin: '/server/docker_utils/backup.sh:12'
}

describe('createLogContentId', () => {
  it('Should be made of the location, the level, the message and the origin', () => {
    expect(createLogContentId(log)).toBe(
      '{"location":"/server/docker_utils/log/backup.jsonl","level":"WARNING","message":"Disk almost full","origin":"/server/docker_utils/backup.sh:12"}'
    )
  })

  it('Should leave the origin out when the log has none', () => {
    expect(createLogContentId({ ...log, origin: undefined })).toBe(
      '{"location":"/server/docker_utils/log/backup.jsonl","level":"WARNING","message":"Disk almost full"}'
    )
  })

  it.each<Partial<Log>>([
    { date: '2026-04-29T10:00:00.000Z' },
    { jobId: 67 },
    { groupName: 'other' },
    { locationName: 'other' }
  ])('Should be the same for a log that only differs by %o', (difference) => {
    expect(createLogContentId({ ...log, ...difference })).toBe(createLogContentId(log))
  })
})
