import '@testing-library/jest-dom/vitest'
import nock from 'nock'

import { queryClient } from './initializers/api/queryClient'
import { mockConfig } from './test/utils/mockConfig'

// The backend gives index.html the <base> the app reads where it is reached from: the page of the
// tests gets the one of the test config.
const base = document.createElement('base')
base.href = `${mockConfig.APP_URL}/`
document.head.append(base)

// A request no nock mock answers fails, instead of reaching the network.
nock.disableNetConnect()

// Each test starts from an empty cache, and sees a failed query fail at once.
queryClient.setDefaultOptions({
  queries: {
    retry: false,
    gcTime: 0,
    staleTime: 0
  }
})

afterEach(() => {
  queryClient.clear()

  const pendingMocks = nock.pendingMocks()
  nock.cleanAll()

  if (pendingMocks.length > 0) {
    throw new Error(`Requests mocked but never sent: ${pendingMocks.join(', ')}`)
  }
})
