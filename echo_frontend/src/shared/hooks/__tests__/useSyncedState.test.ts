import { act, renderHook } from '@testing-library/react'

import { useSyncedState } from '../useSyncedState'

describe('useSyncedState', () => {
  test('Should start from the source value', () => {
    const { result } = renderHook(() => useSyncedState('source'))

    const [value] = result.current

    expect(value).toBe('source')
  })

  test('Should keep the value that was set while the source value does not change', () => {
    const { result, rerender } = renderHook(({ sourceValue }) => useSyncedState(sourceValue), {
      initialProps: { sourceValue: 'source' }
    })

    act(() => {
      const [, setValue] = result.current
      setValue('local')
    })

    rerender({ sourceValue: 'source' })

    const [value] = result.current

    expect(value).toBe('local')
  })

  test('Should take the source value back when it changes', () => {
    const { result, rerender } = renderHook(({ sourceValue }) => useSyncedState(sourceValue), {
      initialProps: { sourceValue: 'source' }
    })

    act(() => {
      const [, setValue] = result.current
      setValue('local')
    })

    rerender({ sourceValue: 'new source' })

    const [value] = result.current

    expect(value).toBe('new source')
  })
})
