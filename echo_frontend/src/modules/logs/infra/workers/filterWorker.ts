import { createFilterWorkerRequestHandler } from './createFilterWorkerRequestHandler'
import type { FilterWorkerRequest } from './filterWorkerMessages'

const handleFilterWorkerRequest = createFilterWorkerRequestHandler()

/** Entry point of the filter worker: it answers the requests away from the main thread. */
self.onmessage = (messageEvent: MessageEvent<FilterWorkerRequest>): void => {
  const answer = handleFilterWorkerRequest(messageEvent.data)

  if (answer !== undefined) {
    self.postMessage(answer)
  }
}
