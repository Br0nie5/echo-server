import { waitFor } from '@testing-library/react'
import nock from 'nock'
import { afterEach, describe, expect, it } from 'vitest'

import { queryClient } from '../../../../initializers/api/queryClient'
import { mockConfig } from '../../../../test/mocks/mockConfig'
import { renderAppHook } from '../../../../test/renderAppHook'
import { useGetAuthCheck } from '../useGetAuthCheck'

describe('useGetAuthCheck', () => {
  const testDefaultOptions = queryClient.getDefaultOptions()

  afterEach(() => {
    queryClient.setDefaultOptions(testDefaultOptions)
  })

  // Without a gcTime of 0, the result of the auth check would stay fresh for 5 minutes in the app,
  // and the auth screen, opened again after a session ended, would redirect at once on the status
  // cached while it was still valid. No screen test sees it, as setupTests.ts gives every query a
  // gcTime of 0: it is taken off here, so the option read is the one of the query.
  it('Should drop its result as soon as no screen uses it', async () => {
    queryClient.setDefaultOptions({
      queries: { ...testDefaultOptions.queries, gcTime: undefined }
    })
    nock(mockConfig.API_URL).get('/auth/status').reply(200, { status: 'authenticated' })

    const { result } = renderAppHook(() => useGetAuthCheck())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const authCheckQuery = queryClient.getQueryCache().find({ queryKey: ['auth', 'check'] })
    expect(authCheckQuery?.options.gcTime).toBe(0)
  })
})
