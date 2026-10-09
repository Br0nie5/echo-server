import userEvent from '@testing-library/user-event'
import { useState, type JSX } from 'react'

import { renderComponent } from '../../../test/renderComponent'
import { toggleTagFromList } from '../../utils/toggleTagFromList'
import { FilterChips } from '../FilterChips'

type RenderedComponent = Awaited<ReturnType<typeof renderComponent>>

const getTagChip = (component: RenderedComponent, tag: string): HTMLElement | null =>
  component.getByText(tag).closest('div')

const expectTagToBeSelected = (component: RenderedComponent, tag: string): void => {
  expect(getTagChip(component, tag)).toHaveClass('MuiChip-colorPrimary')
}

const expectTagNotToBeSelected = (component: RenderedComponent, tag: string): void => {
  expect(getTagChip(component, tag)).toHaveClass('MuiChip-colorDefault')
}

describe('FilterChips', () => {
  test('Should display the tags', async () => {
    const tags = ['First Tag', 'Second Tag', 'Third Tag']

    const component = await renderComponent(<FilterChips tags={tags} mode="multi-select" />)

    tags.forEach((tag) => {
      expect(component.getByText(tag))
    })
  })

  describe('multi-select mode', () => {
    test('Should display the several selected tags with a different color', async () => {
      const user = userEvent.setup()

      const tags = ['First Tag', 'Second Tag', 'Third Tag', 'Fourth Tag']
      const selectedTags = [tags[0], tags[3]]
      const unselectedTags = tags.filter((tag) => !selectedTags.includes(tag))

      expect(selectedTags.length > 1).toBeTruthy()
      expect(unselectedTags.length > 1).toBeTruthy()

      const component = await renderComponent(<FilterChips tags={tags} mode="multi-select" />)

      for (const selectedTag of selectedTags) {
        await user.click(component.getByText(selectedTag))
      }

      selectedTags.forEach((selectedTag) => {
        expectTagToBeSelected(component, selectedTag)
      })

      unselectedTags.forEach((unselectedTag) => {
        expectTagNotToBeSelected(component, unselectedTag)
      })
    })

    test('Should display values from controlledState if given', async () => {
      const user = userEvent.setup()

      const tags = ['First Tag', 'Second Tag', 'Third Tag']
      const initialSelectedTags = [tags[1]]

      const resetTagsButtonLabel = 'Reset tags'

      const setValue = vi.fn()

      const Parent = (): JSX.Element => {
        const [selectedTags, setSelectedTags] = useState<string[]>(initialSelectedTags)

        return (
          <>
            <FilterChips
              tags={tags}
              mode="multi-select"
              controlledState={{
                value: selectedTags,
                setValue: (newSelectedTags) => {
                  setValue(newSelectedTags)
                  setSelectedTags(newSelectedTags)
                }
              }}
            />
            <button onClick={() => setSelectedTags([])}>{resetTagsButtonLabel}</button>
          </>
        )
      }

      const component = await renderComponent(<Parent />)

      expectTagNotToBeSelected(component, tags[0])
      expectTagToBeSelected(component, tags[1])
      expectTagNotToBeSelected(component, tags[2])

      await user.click(component.getByText(tags[0]))

      expect(setValue).toHaveBeenCalledExactlyOnceWith([tags[1], tags[0]])

      expectTagToBeSelected(component, tags[0])
      expectTagToBeSelected(component, tags[1])
      expectTagNotToBeSelected(component, tags[2])

      await user.click(component.getByText(resetTagsButtonLabel))

      tags.forEach((tag) => {
        expectTagNotToBeSelected(component, tag)
      })
    })
  })

  describe('single-select mode', () => {
    test('Should display the single selected tag with a different color', async () => {
      const user = userEvent.setup()

      const tags = ['First Tag', 'Second Tag', 'Third Tag', 'Fourth Tag']
      const selectedTag = tags[2]
      const unselectedTags = toggleTagFromList(tags, selectedTag)

      expect(unselectedTags.length === tags.length - 1).toBeTruthy()

      const component = await renderComponent(<FilterChips tags={tags} mode="single-select" />)

      await user.click(component.getByText(tags[0]))
      await user.click(component.getByText(selectedTag))

      expectTagNotToBeSelected(component, tags[0])
      expectTagToBeSelected(component, selectedTag)

      unselectedTags.forEach((unselectedTag) => {
        expectTagNotToBeSelected(component, unselectedTag)
      })
    })

    test('Should display values from controlledState if given', async () => {
      const user = userEvent.setup()

      const tags = ['First Tag', 'Second Tag', 'Third Tag']
      const initialSelectedTag = tags[1]

      const resetTagsButtonLabel = 'Reset tags'

      const setValue = vi.fn()

      const Parent = (): JSX.Element => {
        const [selectedTag, setSelectedTag] = useState<string | undefined>(initialSelectedTag)

        return (
          <>
            <FilterChips
              tags={tags}
              mode="single-select"
              controlledState={{
                value: selectedTag,
                setValue: (newSelectedTag) => {
                  setValue(newSelectedTag)
                  setSelectedTag(newSelectedTag)
                }
              }}
            />
            <button onClick={() => setSelectedTag(undefined)}>{resetTagsButtonLabel}</button>
          </>
        )
      }

      const component = await renderComponent(<Parent />)

      expectTagNotToBeSelected(component, tags[0])
      expectTagToBeSelected(component, tags[1])
      expectTagNotToBeSelected(component, tags[2])

      await user.click(component.getByText(tags[2]))

      expect(setValue).toHaveBeenCalledExactlyOnceWith(tags[2])

      expectTagNotToBeSelected(component, tags[0])
      expectTagNotToBeSelected(component, tags[1])
      expectTagToBeSelected(component, tags[2])

      await user.click(component.getByText(resetTagsButtonLabel))

      tags.forEach((tag) => {
        expectTagNotToBeSelected(component, tag)
      })
    })
  })
})
