import { renderHook } from '@testing-library/react'
import axios from 'axios'

import { ApiContext } from '../ApiContext'
import { useApi } from '../useApi'

describe('useApi', () => {
  test('Should give the axios instance of ApiContext', () => {
    const axiosInstance = axios.create()

    const { result } = renderHook(() => useApi(), {
      wrapper: ({ children }) => (
        <ApiContext.Provider value={{ axiosInstance }}>{children}</ApiContext.Provider>
      )
    })

    expect(result.current).toBe(axiosInstance)
  })

  test('Should throw outside of ApiContext', () => {
    expect(() => renderHook(() => useApi())).toThrow('useApi must be used within ApiProvider')
  })
})
