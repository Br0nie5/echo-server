import type { Log } from '@echo/utilities'
import { describe, expect, test } from 'vitest'

import { createFilterWorkerRequestHandler } from '../createFilterWorkerRequestHandler'

const buildLog = (overrides: Partial<Log>): Log => ({
  id: 'id',
  date: '2026-01-02T10:00:00.000Z',
  jobId: 1,
  category: 'INFO',
  fileName: 'file',
  message: 'message',
  callFile: 'file.sh',
  callLine: 1,
  ...overrides
})

const logs = [
  buildLog({ id: 'a', category: 'ERROR', message: 'disk is full' }),
  buildLog({ id: 'b', category: 'INFO', message: 'disk checked' }),
  buildLog({ id: 'c', category: 'ERROR', message: 'network is down' })
]

describe('createFilterWorkerRequestHandler', () => {
  test('should not answer when it is given logs', () => {
    const handleFilterWorkerRequest = createFilterWorkerRequestHandler()

    expect(handleFilterWorkerRequest({ type: 'setLogs', logs })).toBeUndefined()
  })

  test('should answer with the indexes of the logs matching both the categories and the search', () => {
    const handleFilterWorkerRequest = createFilterWorkerRequestHandler()
    handleFilterWorkerRequest({ type: 'setLogs', logs })

    expect(
      handleFilterWorkerRequest({
        type: 'filterLogs',
        logCategoriesFilters: ['ERROR'],
        logSearchFilters: []
      })
    ).toEqual({ matchingLogIndexes: [0, 2] })

    expect(
      handleFilterWorkerRequest({
        type: 'filterLogs',
        logCategoriesFilters: ['ERROR'],
        logSearchFilters: [{ mode: 'find', search: 'disk' }]
      })
    ).toEqual({ matchingLogIndexes: [0] })
  })

  test('should filter the logs it was last given', () => {
    const handleFilterWorkerRequest = createFilterWorkerRequestHandler()
    handleFilterWorkerRequest({ type: 'setLogs', logs })
    handleFilterWorkerRequest({ type: 'setLogs', logs: [logs[1], logs[2]] })

    expect(
      handleFilterWorkerRequest({
        type: 'filterLogs',
        logCategoriesFilters: ['ERROR'],
        logSearchFilters: []
      })
    ).toEqual({ matchingLogIndexes: [1] })
  })

  test('should answer with no index before it is given logs', () => {
    const handleFilterWorkerRequest = createFilterWorkerRequestHandler()

    expect(
      handleFilterWorkerRequest({
        type: 'filterLogs',
        logCategoriesFilters: [],
        logSearchFilters: []
      })
    ).toEqual({ matchingLogIndexes: [] })
  })
})
