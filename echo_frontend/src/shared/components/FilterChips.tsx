import { Box, Chip } from '@mui/material'
import { memo, useState, type JSX } from 'react'

import type { ControlledState } from '../types/controlledState'
import { toggleTagFromList } from '../utils/toggleTagFromList'

type FilterChipsBaseProps<TTag extends string> = {
  /** The tags to display, one chip each, in this order. */
  tags: TTag[]
}

type FilterChipsSingleSelectProps<TTag extends string> = FilterChipsBaseProps<TTag> & {
  /** Selecting a tag replaces the selected one. */
  mode: 'single-select'
  /** The selected tag, held by the parent: `undefined` when none is. */
  controlledState?: ControlledState<TTag | undefined>
}

type FilterChipsMultiSelectProps<TTag extends string> = FilterChipsBaseProps<TTag> & {
  /** Selecting a tag adds it to the selected ones, or removes it from them. */
  mode: 'multi-select'
  /** The selected tags, held by the parent. */
  controlledState?: ControlledState<TTag[]>
}

type FilterChipsProps<TTag extends string> =
  FilterChipsSingleSelectProps<TTag> | FilterChipsMultiSelectProps<TTag>

const toTagList = <TTag extends string>(selection: TTag | TTag[] | undefined): TTag[] => {
  if (selection === undefined) {
    return []
  }
  return Array.isArray(selection) ? selection : [selection]
}

const FilterChipsComponent = <TTag extends string>({
  tags,
  mode,
  controlledState
}: FilterChipsProps<TTag>): JSX.Element => {
  const [uncontrolledSelectedTags, setUncontrolledSelectedTags] = useState<TTag[]>([])

  const selectedTags =
    controlledState !== undefined ? toTagList(controlledState.value) : uncontrolledSelectedTags

  const selectTag = (tag: TTag): void => {
    if (mode === 'single-select') {
      if (controlledState !== undefined) {
        controlledState.setValue(tag)
      } else {
        setUncontrolledSelectedTags([tag])
      }
    } else {
      const newSelectedTags = toggleTagFromList(selectedTags, tag)

      if (controlledState !== undefined) {
        controlledState.setValue(newSelectedTags)
      } else {
        setUncontrolledSelectedTags(newSelectedTags)
      }
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
          onClick={() => selectTag(tag)}
        />
      ))}
    </Box>
  )
}

/**
 * A row of clickable chips, one per tag, the selected ones highlighted.
 *
 * Only `tags` and `mode` are required. `mode` says whether one tag
 * (`'single-select'`) or several (`'multi-select'`) can be selected, and with
 * it the type of `controlledState`: a tag in the first case, a list of tags in
 * the second.
 *
 * Without `controlledState`, the component holds its selection itself,
 * starting with no tag selected, and its parent is not told about it:
 *
 * ```tsx
 * <FilterChips tags={['error', 'warning']} mode="multi-select" />
 * ```
 *
 * With `controlledState`, the parent holds the selection and the component
 * keeps none of its own: it displays `controlledState.value` and gives the new
 * selection to `controlledState.setValue` on each click.
 *
 * ```tsx
 * const [selectedTags, setSelectedTags] = useState<Tag[]>([])
 *
 * <FilterChips
 *   tags={tags}
 *   mode="multi-select"
 *   controlledState={{ value: selectedTags, setValue: setSelectedTags }}
 * />
 * ```
 */
export const FilterChips = memo(FilterChipsComponent) as <TTag extends string>(
  props: FilterChipsProps<TTag>
) => JSX.Element
