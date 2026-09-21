import { render } from '@testing-library/react'

import { renderComponent } from '../../../../../test/renderComponent'
import { LogsBox } from '../LogsBox'

describe('LogsBox', () => {
  test('Should be closed by default when isOpenedAtStart is false', async () => {
    const component = await renderComponent(
      <LogsBox id="1" title={<span>Title</span>} isOpenedAtStart={false} />
    )

    expect(component.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
  })

  test('Should be open by default when isOpenedAtStart is true', async () => {
    const component = await renderComponent(
      <LogsBox id="1" title={<span>Title</span>} isOpenedAtStart={true} />
    )

    expect(component.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
  })

  test('Should reopen or reclose when isOpenedAtStart changes on rerender', () => {
    const component = render(<LogsBox id="1" title={<span>Title</span>} isOpenedAtStart={false} />)

    expect(component.getByRole('button')).toHaveAttribute('aria-expanded', 'false')

    component.rerender(<LogsBox id="1" title={<span>Title</span>} isOpenedAtStart={true} />)

    expect(component.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
  })
})
