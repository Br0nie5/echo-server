import { describe, it, expect } from 'vitest'

import { renderComponent } from '../../../test/renderComponent'
import { PageLayout } from '../PageLayout'

describe('PageLayout', () => {
  it('Should render the title element', () => {
    const title = 'My Title'
    const screen = renderComponent(<PageLayout header={<h1>{title}</h1>} />)

    expect(screen.getByText(title)).toBeInTheDocument()
  })

  it('Should render children when provided', () => {
    const childContent = 'Child content'

    const screen = renderComponent(
      <PageLayout header={<h1>Title</h1>}>
        <p>{childContent}</p>
      </PageLayout>
    )

    expect(screen.getByText(childContent)).toBeInTheDocument()
  })
})
