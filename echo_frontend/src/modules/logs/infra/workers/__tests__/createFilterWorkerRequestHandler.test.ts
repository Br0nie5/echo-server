import { describe, expect, test } from 'vitest'

import { createFilterWorkerRequestHandler } from '../createFilterWorkerRequestHandler'

describe('createFilterWorkerRequestHandler', () => {
  test('Should answer with no index before it is given logs', () => {
    const handleFilterWorkerRequest = createFilterWorkerRequestHandler()

    expect(
      handleFilterWorkerRequest({
        type: 'filterLogs',
        logLevelsFilters: [],
        logSearchFilters: []
      })
    ).toEqual({ matchingLogIndexes: [] })
  })
})
