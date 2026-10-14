import { Box, Chip } from '@mui/material'
import { memo, useState, type JSX } from 'react'

import type { ControlledState } from '../types/controlledState'
import { toggleTagFromList } from '../utils/toggleTagFromList'

type FilterChipsProps<TTag extends string> = {
  /** The tags to display, one chip each, in this order. */
  tags: TTag[]
  /** The selected tags, held by the parent. */
  controlledState?: ControlledState<TTag[]>
}

const FilterChipsComponent = <TTag extends string>({
  tags,
  controlledState
}: FilterChipsProps<TTag>): JSX.Element => {
  const [uncontrolledSelectedTags, setUncontrolledSelectedTags] = useState<TTag[]>([])

  const selectedTags =
    controlledState !== undefined ? controlledState.value : uncontrolledSelectedTags

  const toggleTag = (tag: TTag): void => {
    const newSelectedTags = toggleTagFromList(selectedTags, tag)

    if (controlledState !== undefined) {
      controlledState.setValue(newSelectedTags)
    } else {
      setUncontrolledSelectedTags(newSelectedTags)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
        mb: 3
      }}
    >
      {tags.map((tag) => (
        <Chip
          key={tag}
          label={tag}
          clickable
          color={selectedTags.includes(tag) ? 'primary' : 'default'}
          onClick={() => toggleTag(tag)}
        />
      ))}
    </Box>
  )
}

/**
 * A row of clickable chips, one per tag, the selected ones highlighted.
 *
 * Clicking a chip adds its tag to the selected ones, or removes it from them. Only `tags` is
 * required.
 *
 * Without `controlledState`, the component holds its selection itself, starting with no tag
 * selected, and its parent is not told about it:
 *
 * ```tsx
 * <FilterChips tags={['error', 'warning']} />
 * ```
 *
 * With `controlledState`, the parent holds the selection and the component keeps none of its own:
 * it displays `controlledState.value` and gives the new selection to `controlledState.setValue` on
 * each click.
 *
 * ```tsx
 * const [selectedTags, setSelectedTags] = useState<Tag[]>([])
 *
 * <FilterChips tags={tags} controlledState={{ value: selectedTags, setValue: setSelectedTags }} />
 * ```
 */
export const FilterChips = memo(FilterChipsComponent) as <TTag extends string>(
  props: FilterChipsProps<TTag>
) => JSX.Element
