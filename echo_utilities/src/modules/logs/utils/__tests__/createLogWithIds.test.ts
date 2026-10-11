import { describe, it, expect } from 'vitest'

import type { Log } from '../../schemas/log.schema.js'
import { LogCategory } from '../../schemas/logCategory.schema.js'
import { createLogWithIds } from '../createLogWithIds.js'

const noIdsLog: Omit<Log, 'id' | 'contentId'> = {
  date: '2026-04-28T10:00:00.000Z',
  groupName: 'docker_utils',
  location: '/server/docker_utils/log/backup.jsonl',
  locationName: 'backup',
  jobId: 66,
  category: LogCategory.WARNING,
  message: 'Disk almost full',
  origin: '/server/docker_utils/backup.sh:12'
}

describe('createLogWithIds', () => {
  it('Should give the log with its id, made with the id number, and its contentId', () => {
    expect(createLogWithIds(noIdsLog, 3)).toEqual({
      ...noIdsLog,
      id: '{"idNumber":3,"date":"2026-04-28T10:00:00.000Z","jobId":66,"location":"/server/docker_utils/log/backup.jsonl","category":"WARNING","message":"Disk almost full","origin":"/server/docker_utils/backup.sh:12"}',
      contentId:
        '{"location":"/server/docker_utils/log/backup.jsonl","category":"WARNING","message":"Disk almost full","origin":"/server/docker_utils/backup.sh:12"}'
    })
  })
})
