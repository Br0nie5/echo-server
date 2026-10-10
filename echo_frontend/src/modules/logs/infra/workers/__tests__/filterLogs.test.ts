import type { Log } from '@echo/utilities'
import { afterEach, describe, expect, test, vi, type Mock } from 'vitest'

import { createFilterLogs } from '../filterLogs'
import type { FilterWorkerAnswer, FilterWorkerRequest } from '../filterWorkerMessages'

const buildLog = (id: string): Log => ({
  id,
  date: '2026-01-02T10:00:00.000Z',
  jobId: 1,
  category: 'INFO',
  location: '/logs/file.jsonl',
  locationName: 'file',
  message: 'message',
  callFile: 'file.sh',
  callLine: 1
})

const logs = [buildLog('a'), buildLog('b'), buildLog('c')]

interface FakeWorker {
  postMessage: Mock<(request: FilterWorkerRequest) => void>
  onmessage: Worker['onmessage']
  onerror: Worker['onerror']
}

const buildFakeWorker = (): FakeWorker => ({
  postMessage: vi.fn<(request: FilterWorkerRequest) => void>(),
  onmessage: null,
  onerror: null
})

const answer = (worker: FakeWorker, workerAnswer: FilterWorkerAnswer): void => {
  worker.onmessage?.call(worker as unknown as Worker, { data: workerAnswer } as MessageEvent)
}

const fail = (worker: FakeWorker, message: string): void => {
  worker.onerror?.call(worker as unknown as Worker, { message } as ErrorEvent)
}

const getSentRequestTypes = (worker: FakeWorker): string[] =>
  worker.postMessage.mock.calls.map(([request]) => request.type)

describe('createFilterLogs', () => {
  test('Should give the worker the logs then the filters, and resolve with the very logs the worker points at', async () => {
    const worker = buildFakeWorker()
    const filterLogs = createFilterLogs(worker)

    const filteredLogs = filterLogs(logs, ['INFO'], [{ mode: 'find', search: 'message' }])

    expect(worker.postMessage.mock.calls).toEqual([
      [{ type: 'setLogs', logs }],
      [
        {
          type: 'filterLogs',
          logCategoriesFilters: ['INFO'],
          logSearchFilters: [{ mode: 'find', search: 'message' }]
        }
      ]
    ])

    answer(worker, { matchingLogIndexes: [0, 2] })

    const [firstLog, secondLog] = await filteredLogs
    expect(firstLog).toBe(logs[0])
    expect(secondLog).toBe(logs[2])
  })

  test('Should only give the worker the logs again when they are another list', async () => {
    const worker = buildFakeWorker()
    const filterLogs = createFilterLogs(worker)
    const otherLogs = [buildLog('d')]

    const firstFiltering = filterLogs(logs, [], [])
    answer(worker, { matchingLogIndexes: [] })
    await firstFiltering

    const secondFiltering = filterLogs(logs, ['ERROR'], [])
    answer(worker, { matchingLogIndexes: [] })
    await secondFiltering

    const thirdFiltering = filterLogs(otherLogs, [], [])
    answer(worker, { matchingLogIndexes: [0] })

    await expect(thirdFiltering).resolves.toEqual(otherLogs)
    expect(getSentRequestTypes(worker)).toEqual([
      'setLogs',
      'filterLogs',
      'filterLogs',
      'setLogs',
      'filterLogs'
    ])
  })

  test('Should give the worker one request at a time, each answered in turn', async () => {
    const worker = buildFakeWorker()
    const filterLogs = createFilterLogs(worker)

    const firstFiltering = filterLogs(logs, [], [])
    const secondFiltering = filterLogs(logs, ['ERROR'], [])

    expect(getSentRequestTypes(worker)).toEqual(['setLogs', 'filterLogs'])

    answer(worker, { matchingLogIndexes: [0] })

    expect(getSentRequestTypes(worker)).toEqual(['setLogs', 'filterLogs', 'filterLogs'])

    answer(worker, { matchingLogIndexes: [1] })

    await expect(firstFiltering).resolves.toEqual([logs[0]])
    await expect(secondFiltering).resolves.toEqual([logs[1]])
  })

  test('Should reject a request aborted while it waits, without ever sending it to the worker', async () => {
    const worker = buildFakeWorker()
    const filterLogs = createFilterLogs(worker)
    const abortController = new AbortController()

    const runningFiltering = filterLogs(logs, [], [])
    const abortedFiltering = filterLogs(logs, ['ERROR'], [], abortController.signal)

    abortController.abort(new Error('aborted'))
    answer(worker, { matchingLogIndexes: [0] })

    await expect(abortedFiltering).rejects.toThrow('aborted')
    await expect(runningFiltering).resolves.toEqual([logs[0]])
    expect(getSentRequestTypes(worker)).toEqual(['setLogs', 'filterLogs'])
  })

  test('Should reject a request aborted while it runs, and start the next one once the worker has answered it', async () => {
    const worker = buildFakeWorker()
    const filterLogs = createFilterLogs(worker)
    const abortController = new AbortController()

    const abortedFiltering = filterLogs(logs, [], [], abortController.signal)
    const nextFiltering = filterLogs(logs, ['ERROR'], [])

    abortController.abort(new Error('aborted'))

    await expect(abortedFiltering).rejects.toThrow('aborted')
    expect(getSentRequestTypes(worker)).toEqual(['setLogs', 'filterLogs'])

    answer(worker, { matchingLogIndexes: [0] })
    answer(worker, { matchingLogIndexes: [1] })

    await expect(nextFiltering).resolves.toEqual([logs[1]])
  })

  test('Should reject every request, running, waiting and to come, once the worker has failed', async () => {
    const worker = buildFakeWorker()
    const filterLogs = createFilterLogs(worker)

    const runningFiltering = filterLogs(logs, [], [])
    const waitingFiltering = filterLogs(logs, ['ERROR'], [])

    fail(worker, 'worker crashed')

    await expect(runningFiltering).rejects.toThrow('worker crashed')
    await expect(waitingFiltering).rejects.toThrow('worker crashed')
    await expect(filterLogs(logs, [], [])).rejects.toThrow('worker crashed')
    expect(getSentRequestTypes(worker)).toEqual(['setLogs', 'filterLogs'])
  })

  test('Should reject the requests to come when the worker fails while idle', async () => {
    const worker = buildFakeWorker()
    const filterLogs = createFilterLogs(worker)

    fail(worker, 'worker did not load')

    await expect(filterLogs(logs, [], [])).rejects.toThrow('worker did not load')
    expect(worker.postMessage).not.toHaveBeenCalled()
  })

  test('Should ignore an answer when no request is running', () => {
    const worker = buildFakeWorker()
    createFilterLogs(worker)

    expect(() => answer(worker, { matchingLogIndexes: [0] })).not.toThrow()
    expect(worker.postMessage).not.toHaveBeenCalled()
  })
})

describe('filterLogs', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  test('Should start the app-wide worker at the first filtering only', async () => {
    const startedWorkers: FakeWorker[] = []
    vi.stubGlobal(
      'Worker',
      vi.fn(function WorkerStub() {
        const worker = buildFakeWorker()
        startedWorkers.push(worker)
        return worker
      })
    )
    vi.resetModules()
    const { filterLogs } = await import('../filterLogs')

    expect(startedWorkers).toHaveLength(0)

    const firstFiltering = filterLogs(logs, [], [])
    answer(startedWorkers[0], { matchingLogIndexes: [0] })
    await expect(firstFiltering).resolves.toEqual([logs[0]])

    const secondFiltering = filterLogs(logs, ['ERROR'], [])
    answer(startedWorkers[0], { matchingLogIndexes: [1] })
    await expect(secondFiltering).resolves.toEqual([logs[1]])

    expect(startedWorkers).toHaveLength(1)
  })
})
