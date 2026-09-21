import { describe, it, expect } from 'vitest'

import { renderComponent } from '../../../test/renderComponent'
import { PageLayout } from '../PageLayout'

describe('PageLayout', () => {
  it('should render the title element', async () => {
    const title = 'My Title'
    const screen = await renderComponent(<PageLayout header={<h1>{title}</h1>} />)

    expect(screen.getByText(title)).toBeInTheDocument()
  })

  it('should render children when provided', async () => {
    const childContent = 'Child content'

    const screen = await renderComponent(
      <PageLayout header={<h1>Title</h1>}>
        <p>{childContent}</p>
      </PageLayout>
    )

    expect(screen.getByText(childContent)).toBeInTheDocument()
  })
})
