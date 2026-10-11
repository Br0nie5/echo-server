import { createLogWithIds, type Log } from '@echo/utilities'
import { describe, expect, test } from 'vitest'

import { createFilterWorkerRequestHandler } from '../createFilterWorkerRequestHandler'

const buildLog = (overrides: Partial<Omit<Log, 'id' | 'contentId'>>): Log =>
  createLogWithIds(
    {
      date: '2026-01-02T10:00:00.000Z',
      jobId: 1,
      category: 'INFO',
      location: '/server/log/prune_images.jsonl',
      locationName: 'prune_images',
      message: 'message',
      origin: '/server/prune_images.sh:12',
      ...overrides
    },
    0
  )

const logs = [
  buildLog({ category: 'ERROR', message: 'disk is full' }),
  buildLog({ category: 'INFO', message: 'disk checked' }),
  buildLog({ category: 'ERROR', message: 'network is down' })
]

describe('createFilterWorkerRequestHandler', () => {
  test('Should not answer when it is given logs', () => {
    const handleFilterWorkerRequest = createFilterWorkerRequestHandler()

    expect(handleFilterWorkerRequest({ type: 'setLogs', logs })).toBeUndefined()
  })

  test('Should answer with the indexes of the logs matching both the categories and the search', () => {
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

  test('Should filter the logs it was last given', () => {
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

  test('Should answer with no index before it is given logs', () => {
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
