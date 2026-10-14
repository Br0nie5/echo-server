import { useState, type Dispatch, type SetStateAction } from 'react'

/**
 * A state that starts from `sourceValue` and takes it back each time it changes.
 *
 * It is used like a `useState`: between two changes of `sourceValue`, the state
 * is free to be set to anything. When `sourceValue` changes, what was set is
 * lost and the state is `sourceValue` again.
 *
 * Use it for the local state of a component that an outside value can
 * override, such as the text being typed in an input a parent can reset:
 *
 * ```tsx
 * const [inputValue, setInputValue] = useSyncedState(submittedSearch)
 * ```
 */
export const useSyncedState = <TValue>(
  sourceValue: TValue
): [TValue, Dispatch<SetStateAction<TValue>>] => {
  const [value, setValue] = useState(sourceValue)
  const [previousSourceValue, setPreviousSourceValue] = useState(sourceValue)

  // Set during the render, not in an effect: React renders again at once, and
  // the value that no longer follows `sourceValue` is never displayed.
  if (sourceValue !== previousSourceValue) {
    setPreviousSourceValue(sourceValue)
    setValue(sourceValue)
  }

  return [value, setValue]
}
