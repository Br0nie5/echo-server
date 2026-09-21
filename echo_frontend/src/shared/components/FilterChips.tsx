import { Box, Chip } from '@mui/material'
import { memo, useState, type JSX } from 'react'

import { toggleTagFromList } from '../utils/toggleTagFromList'

type FilterChipsBaseProps<TTag extends string> = {
  tags: TTag[]
}

type FilterChipsSingleSelectProps<TTag extends string> = FilterChipsBaseProps<TTag> & {
  mode: 'single-select'
  initialSelectedTags?: TTag
  onSelectTag: (tag: TTag) => void
}

type FilterChipsMultiSelectProps<TTag extends string> = FilterChipsBaseProps<TTag> & {
  mode: 'multi-select'
  initialSelectedTags?: TTag[]
  onSelectTag: (tags: TTag[]) => void
}

type FilterChipsProps<TTag extends string> =
  FilterChipsSingleSelectProps<TTag> | FilterChipsMultiSelectProps<TTag>

const FilterChipsComponent = <TTag extends string>({
  tags,
  mode,
  initialSelectedTags,
  onSelectTag
}: FilterChipsProps<TTag>): JSX.Element => {
  const initialTagsSelection = ((): TTag[] => {
    if (mode === 'single-select') {
      return initialSelectedTags !== undefined ? [initialSelectedTags] : []
    } else {
      return initialSelectedTags !== undefined ? initialSelectedTags : []
    }
  })()

  const [selectedTags, setSelectedTags] = useState<TTag[]>(initialTagsSelection)

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
          onClick={() => {
            if (mode === 'single-select') {
              setSelectedTags([tag])
              onSelectTag(tag)
            } else {
              setSelectedTags((currentSelectedTags) => {
                const newSelectedTags = toggleTagFromList(currentSelectedTags, tag)
                onSelectTag(newSelectedTags)
                return newSelectedTags
              })
            }
          }}
        />
      ))}
    </Box>
  )
}

export const FilterChips = memo(FilterChipsComponent) as <TTag extends string>(
  props: FilterChipsProps<TTag>
) => JSX.Element
