import { renderHook } from '@testing-library/react'

import { buildMockConfig } from '../../../test/mocks/mockConfig'
import { ConfigContext } from '../ConfigContext'
import { useConfig } from '../useConfig'

describe('useConfig', () => {
  test('Should give the config of ConfigContext', () => {
    const config = buildMockConfig(new Date(2026, 3, 28, 10, 0, 0))

    const { result } = renderHook(() => useConfig(), {
      wrapper: ({ children }) => (
        <ConfigContext.Provider value={{ config }}>{children}</ConfigContext.Provider>
      )
    })

    expect(result.current).toBe(config)
  })

  test('Should throw outside of ConfigContext', () => {
    expect(() => renderHook(() => useConfig())).toThrow(
      'useConfig must be used within ConfigProvider'
    )
  })
})
