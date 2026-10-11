import { describe, it, expect } from 'vitest'

import type { Log } from '../../schemas/log.schema.js'
import { LogLevel } from '../../schemas/logLevel.schema.js'
import { createLogId } from '../createLogId.js'

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

describe('createLogId', () => {
  it('Should be made of the id number, the date, the job, the location, the level, the message and the origin', () => {
    expect(createLogId(log, 3)).toBe(
      '{"idNumber":3,"date":"2026-04-28T10:00:00.000Z","jobId":66,"location":"/server/docker_utils/log/backup.jsonl","level":"WARNING","message":"Disk almost full","origin":"/server/docker_utils/backup.sh:12"}'
    )
  })

  it('Should leave the origin out when the log has none', () => {
    expect(createLogId({ ...log, origin: undefined }, 3)).toBe(
      '{"idNumber":3,"date":"2026-04-28T10:00:00.000Z","jobId":66,"location":"/server/docker_utils/log/backup.jsonl","level":"WARNING","message":"Disk almost full"}'
    )
  })

  it('Should differ for the same log with another id number', () => {
    expect(createLogId(log, 4)).not.toBe(createLogId(log, 3))
  })
})
