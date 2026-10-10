// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/vitest'
import nock from 'nock'

import { queryClient } from './initializers/api/queryClient'
import { testConfig } from './test/utils/config'

// The backend gives index.html the <base> the app reads where it is reached from: the page of the
// tests gets the one of the test config.
const base = document.createElement('base')
base.href = `${testConfig.APP_URL}/`
document.head.append(base)

afterEach(() => {
  queryClient.clear()

  const pendingMocks = nock.pendingMocks()
  if (pendingMocks.length > 0) {
    console.error(`You still have pending mocks : ${pendingMocks}`)
  }

  nock.cleanAll()
})
