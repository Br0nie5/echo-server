import userEvent from '@testing-library/user-event'
import { useState, type JSX } from 'react'

import { renderComponent } from '../../../test/renderComponent'
import { FilterChips } from '../FilterChips'

type RenderedComponent = ReturnType<typeof renderComponent>

const getTagChip = (component: RenderedComponent, tag: string): HTMLElement | null =>
  component.getByText(tag).closest('div')

describe('FilterChips', () => {
  test('Should display the tags', () => {
    const tags = ['First Tag', 'Second Tag', 'Third Tag']

    const component = renderComponent(<FilterChips tags={tags} />)

    tags.forEach((tag) => {
      expect(component.getByText(tag)).toBeInTheDocument()
    })
  })

  test('Should highlight the tags the user selects, and no more the one they select again', async () => {
    const user = userEvent.setup()

    const component = renderComponent(
      <FilterChips tags={['First Tag', 'Second Tag', 'Third Tag', 'Fourth Tag']} />
    )

    await user.click(component.getByText('First Tag'))
    await user.click(component.getByText('Second Tag'))
    await user.click(component.getByText('Fourth Tag'))
    await user.click(component.getByText('Second Tag'))

    expect(getTagChip(component, 'First Tag')).toHaveClass('MuiChip-colorPrimary')
    expect(getTagChip(component, 'Second Tag')).toHaveClass('MuiChip-colorDefault')
    expect(getTagChip(component, 'Third Tag')).toHaveClass('MuiChip-colorDefault')
    expect(getTagChip(component, 'Fourth Tag')).toHaveClass('MuiChip-colorPrimary')
  })

  test('Should display the value of controlledState, and give it the new selection', async () => {
    const user = userEvent.setup()

    const tags = ['First Tag', 'Second Tag', 'Third Tag']
    const resetTagsButtonLabel = 'Reset tags'
    const setValue = vi.fn()

    const Parent = (): JSX.Element => {
      const [selectedTags, setSelectedTags] = useState<string[]>(['Second Tag'])

      return (
        <>
          <FilterChips
            tags={tags}
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

    const component = renderComponent(<Parent />)

    expect(getTagChip(component, 'First Tag')).toHaveClass('MuiChip-colorDefault')
    expect(getTagChip(component, 'Second Tag')).toHaveClass('MuiChip-colorPrimary')

    await user.click(component.getByText('First Tag'))

    expect(setValue).toHaveBeenCalledExactlyOnceWith(['Second Tag', 'First Tag'])
    expect(getTagChip(component, 'First Tag')).toHaveClass('MuiChip-colorPrimary')
    expect(getTagChip(component, 'Second Tag')).toHaveClass('MuiChip-colorPrimary')
    expect(getTagChip(component, 'Third Tag')).toHaveClass('MuiChip-colorDefault')

    await user.click(component.getByText(resetTagsButtonLabel))

    tags.forEach((tag) => {
      expect(getTagChip(component, tag)).toHaveClass('MuiChip-colorDefault')
    })
  })
})
