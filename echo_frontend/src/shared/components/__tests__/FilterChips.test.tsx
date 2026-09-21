import userEvent from '@testing-library/user-event'

import { renderComponent } from '../../../test/renderComponent'
import { toggleTagFromList } from '../../utils/toggleTagFromList'
import { FilterChips } from '../FilterChips'

describe('FilterChips', () => {
  test('Should display the tags', async () => {
    const tags = ['First Tag', 'Second Tag', 'Third Tag']

    const component = await renderComponent(
      <FilterChips tags={tags} mode="multi-select" onSelectTag={() => {}} />
    )

    tags.forEach((tag) => {
      expect(component.getByText(tag))
    })
  })

  describe('multi-select mode', () => {
    test('Should display the several selected tags with a different color', async () => {
      const tags = ['First Tag', 'Second Tag', 'Third Tag', 'Fourth Tag']
      const selectedTags = [tags[0], tags[3]]
      const unselectedTags = tags.filter((tag) => !selectedTags.includes(tag))

      expect(selectedTags.length > 1).toBeTruthy()
      expect(unselectedTags.length > 1).toBeTruthy()

      const component = await renderComponent(
        <FilterChips
          tags={tags}
          mode="multi-select"
          initialSelectedTags={selectedTags}
          onSelectTag={() => {}}
        />
      )

      tags.forEach((tag) => {
        expect(component.getByText(tag))
      })

      selectedTags.forEach((selectedTag) => {
        const selectedTagComponent = component.getByText(selectedTag)
        const selectedTagContainerDiv = selectedTagComponent.closest('div')

        expect(selectedTagContainerDiv).toHaveClass('MuiChip-colorPrimary')
      })

      unselectedTags.forEach((unselectedTag) => {
        const unselectedTagComponent = component.getByText(unselectedTag)
        const unselectedTagContainerDiv = unselectedTagComponent.closest('div')

        expect(unselectedTagContainerDiv).toHaveClass('MuiChip-colorDefault')
      })
    })

    test('Should execute onSelectTag callback with the correct type when clicking on a tag and setting the correct selected tags', async () => {
      const user = userEvent.setup()

      type Tag = 'First Tag' | 'Second Tag' | 'Third Tag'
      const tags: Tag[] = ['First Tag', 'Second Tag', 'Third Tag']

      let clickedTag

      const component = await renderComponent(
        <FilterChips
          tags={tags}
          mode="multi-select"
          onSelectTag={(selectedTags: Tag[]) => {
            clickedTag = selectedTags
          }}
        />
      )

      await user.click(component.getByText(tags[0]))

      expect(clickedTag).toStrictEqual([tags[0]])

      await user.click(component.getByText(tags[2]))

      expect(clickedTag).toStrictEqual([tags[0], tags[2]])
    })
  })

  describe('single-select mode', () => {
    test('Should display the single selected tag with a different color', async () => {
      const tags = ['First Tag', 'Second Tag', 'Third Tag', 'Fourth Tag']
      const selectedTag = tags[0]
      const unselectedTags = toggleTagFromList(tags, selectedTag)

      expect(unselectedTags.length === tags.length - 1).toBeTruthy()

      const component = await renderComponent(
        <FilterChips
          tags={tags}
          mode="single-select"
          initialSelectedTags={selectedTag}
          onSelectTag={() => {}}
        />
      )

      tags.forEach((tag) => {
        expect(component.getByText(tag))
      })

      const selectedTagComponent = component.getByText(selectedTag)
      const selectedTagContainerDiv = selectedTagComponent.closest('div')

      expect(selectedTagContainerDiv).toHaveClass('MuiChip-colorPrimary')

      unselectedTags.forEach((unselectedTag) => {
        const unselectedTagComponent = component.getByText(unselectedTag)
        const unselectedTagContainerDiv = unselectedTagComponent.closest('div')

        expect(unselectedTagContainerDiv).toHaveClass('MuiChip-colorDefault')
      })
    })

    test('Should execute onSelectTag callback with the correct type when clicking on a tag', async () => {
      const user = userEvent.setup()

      type Tag = 'First Tag' | 'Second Tag' | 'Third Tag'
      const tags: Tag[] = ['First Tag', 'Second Tag', 'Third Tag']

      let clickedTag

      const component = await renderComponent(
        <FilterChips
          tags={tags}
          mode="single-select"
          onSelectTag={(tag: Tag) => {
            clickedTag = tag
          }}
        />
      )

      await user.click(component.getByText(tags[0]))

      expect(clickedTag).toBe(tags[0])

      await user.click(component.getByText(tags[2]))

      expect(clickedTag).toBe(tags[2])
    })
  })
})
