import { createFilterWorkerRequestHandler } from '../../modules/logs/infra/workers/createFilterWorkerRequestHandler'
import type { FilterWorkerRequest } from '../../modules/logs/infra/workers/filterWorkerMessages'

/**
 * Stands for the filter worker, on the thread of the test.
 *
 * It does with a request what the worker does, and answers in a later task, as the message of a
 * worker comes.
 */
class SameThreadFilterWorker {
  onmessage: Worker['onmessage'] = null
  onerror: Worker['onerror'] = null

  #handleRequest = createFilterWorkerRequestHandler()

  postMessage(request: FilterWorkerRequest): void {
    const answer = this.#handleRequest(request)

    if (answer !== undefined) {
      setTimeout(() => {
        this.onmessage?.call(this as unknown as Worker, { data: answer } as MessageEvent)
      })
    }
  }
}

/**
 * Makes the app filter its logs without a Web Worker, which the page of the tests cannot start.
 *
 * Only the worker is replaced: the app still queues its requests and reads the answers as it does
 * with the real one. Call it before rendering a screen that filters logs, and put the globals back
 * afterwards.
 *
 * ```ts
 * beforeAll(() => stubFilterWorker())
 * afterAll(() => vi.unstubAllGlobals())
 * ```
 */
export const stubFilterWorker = (): void => {
  vi.stubGlobal('Worker', SameThreadFilterWorker)
}
