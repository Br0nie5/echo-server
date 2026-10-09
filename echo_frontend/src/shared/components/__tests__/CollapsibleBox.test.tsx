import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderComponent } from '../../../test/renderComponent'
import { CollapsibleBox } from '../CollapsibleBox'

type RenderedComponent = Awaited<ReturnType<typeof renderComponent>>

const title = 'Title'
const content = 'Content'

const expectBoxToBeOpen = (component: RenderedComponent): void => {
  expect(component.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
  expect(component.getByText(content)).toBeInTheDocument()
}

const expectBoxToBeClosed = (component: RenderedComponent): void => {
  expect(component.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
  expect(component.queryByText(content)).not.toBeInTheDocument()
}

describe('CollapsibleBox', () => {
  test('Should be closed at first, without its content, when isOpenedAtStart is false', async () => {
    const component = await renderComponent(
      <CollapsibleBox id="1" title={<span>{title}</span>} isOpenedAtStart={false}>
        {content}
      </CollapsibleBox>
    )

    expect(component.getByText(title)).toBeInTheDocument()
    expectBoxToBeClosed(component)
  })

  test('Should be open at first, with its content, when isOpenedAtStart is true', async () => {
    const component = await renderComponent(
      <CollapsibleBox id="1" title={<span>{title}</span>} isOpenedAtStart={true}>
        {content}
      </CollapsibleBox>
    )

    expect(component.getByText(title)).toBeInTheDocument()
    expectBoxToBeOpen(component)
  })

  test('Should open then close when clicking on its title', async () => {
    const user = userEvent.setup()

    const component = await renderComponent(
      <CollapsibleBox id="1" title={<span>{title}</span>} isOpenedAtStart={false}>
        {content}
      </CollapsibleBox>
    )

    await user.click(component.getByText(title))

    expectBoxToBeOpen(component)

    await user.click(component.getByText(title))

    expectBoxToBeClosed(component)
  })

  test('Should re-open or re-close when isOpenedAtStart changes on rerender', () => {
    const component = render(
      <CollapsibleBox id="1" title={<span>{title}</span>} isOpenedAtStart={false}>
        {content}
      </CollapsibleBox>
    )

    expectBoxToBeClosed(component)

    component.rerender(
      <CollapsibleBox id="1" title={<span>{title}</span>} isOpenedAtStart={true}>
        {content}
      </CollapsibleBox>
    )

    expectBoxToBeOpen(component)
  })
})
