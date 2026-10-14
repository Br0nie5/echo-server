import type { Dispatch, SetStateAction } from 'react'

/**
 * A state held by a parent and handed to whoever displays and changes it.
 *
 * `setValue` is the setter of a `useState`: it takes the new value, or a
 * function computing it from the current one.
 *
 * Build it once, where the state is declared, and memoize it so that the
 * memoized components it is given to only render again when the value changes:
 *
 * ```ts
 * const [selectedTags, setSelectedTags] = useState<Tag[]>([])
 *
 * const selectedTagsState = useMemo<ControlledState<Tag[]>>(
 *   () => ({ value: selectedTags, setValue: setSelectedTags }),
 *   [selectedTags]
 * )
 * ```
 */
export type ControlledState<TValue> = {
  value: TValue
  setValue: Dispatch<SetStateAction<TValue>>
}
