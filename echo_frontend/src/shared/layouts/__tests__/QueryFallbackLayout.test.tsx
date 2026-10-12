import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { renderComponent } from '../../../test/renderComponent'
import { appTranslation } from '../../../test/utils/appTranslation'
import { QueryFallbackLayout } from '../QueryFallbackLayout'

describe('QueryFallbackLayout', () => {
  it('Should render a CircularProgress when status is pending', () => {
    const screen = renderComponent(<QueryFallbackLayout status="pending" refetch={() => {}} />)

    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })

  it('Should render a no data layout when status is success', () => {
    const screen = renderComponent(<QueryFallbackLayout status="success" refetch={() => {}} />)

    expect(screen.getByText(appTranslation('query.noData'))).toBeInTheDocument()
  })

  it('Should render an error message when status is error', () => {
    const screen = renderComponent(<QueryFallbackLayout status="error" refetch={() => {}} />)

    expect(screen.getByText(appTranslation('query.error'))).toBeInTheDocument()
    expect(screen.getByText(appTranslation('query.refetchButton'))).toBeInTheDocument()
  })

  it('Should execute the refetch callback if the error button is clicked on', async () => {
    const user = userEvent.setup()

    const refetch = vi.fn()

    const screen = renderComponent(<QueryFallbackLayout status="error" refetch={refetch} />)

    await user.click(screen.getByText(appTranslation('query.refetchButton')))

    expect(refetch).toHaveBeenCalledOnce()
  })
})
