import userEvent from '@testing-library/user-event'

import { renderComponent } from '../../../test/renderComponent'
import { CollapsibleBox } from '../CollapsibleBox'

const title = 'Title'
const content = 'Content'

describe('CollapsibleBox', () => {
  test('Should be closed at first, without its content, when isOpenedByParent is false', () => {
    const component = renderComponent(
      <CollapsibleBox title={<span>{title}</span>} isOpenedByParent={false}>
        {content}
      </CollapsibleBox>
    )

    expect(component.getByText(title)).toBeInTheDocument()
    expect(component.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    expect(component.queryByText(content)).not.toBeInTheDocument()
  })

  test('Should be open at first, with its content, when isOpenedByParent is true', () => {
    const component = renderComponent(
      <CollapsibleBox title={<span>{title}</span>} isOpenedByParent={true}>
        {content}
      </CollapsibleBox>
    )

    expect(component.getByText(title)).toBeInTheDocument()
    expect(component.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    expect(component.getByText(content)).toBeInTheDocument()
  })

  test('Should link its header to its content', () => {
    const component = renderComponent(
      <CollapsibleBox title={<span>{title}</span>} isOpenedByParent={true}>
        {content}
      </CollapsibleBox>
    )

    const contentId = component.getByRole('button').getAttribute('aria-controls')
    expect(component.getByRole('region')).toHaveAttribute('id', contentId)
  })

  test('Should open then close when clicking on its title', async () => {
    const user = userEvent.setup()

    const component = renderComponent(
      <CollapsibleBox title={<span>{title}</span>} isOpenedByParent={false}>
        {content}
      </CollapsibleBox>
    )

    await user.click(component.getByText(title))

    expect(component.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    expect(component.getByText(content)).toBeInTheDocument()

    await user.click(component.getByText(title))

    expect(component.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    expect(component.queryByText(content)).not.toBeInTheDocument()
  })

  test('Should open or close again when isOpenedByParent changes', () => {
    const component = renderComponent(
      <CollapsibleBox title={<span>{title}</span>} isOpenedByParent={false}>
        {content}
      </CollapsibleBox>
    )

    component.rerender(
      <CollapsibleBox title={<span>{title}</span>} isOpenedByParent={true}>
        {content}
      </CollapsibleBox>
    )

    expect(component.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    expect(component.getByText(content)).toBeInTheDocument()
  })
})
