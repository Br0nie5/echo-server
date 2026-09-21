// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/vitest'
import nock from 'nock'

import { queryClient } from './initializers/api/queryClient'

afterEach(() => {
  queryClient.clear()

  const pendingMocks = nock.pendingMocks()
  if (pendingMocks.length > 0) {
    console.error(`You still have pending mocks : ${pendingMocks}`)
  }

  nock.cleanAll()
})
