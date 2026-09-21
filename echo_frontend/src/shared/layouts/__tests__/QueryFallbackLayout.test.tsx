import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'

import { renderComponent } from '../../../test/renderComponent'
import i18n from '../../i18n/i18n'
import type { AppTranslation } from '../../i18n/useAppTranslation'
import { QueryFallbackLayout } from '../QueryFallbackLayout'

const appTranslation: AppTranslation = (key) => i18n.t(key)

describe('QueryFallbackLayout', () => {
  it('should render a CircularProgress when status is pending', async () => {
    const screen = await renderComponent(
      <QueryFallbackLayout status="pending" refetch={() => {}} />
    )

    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })

  it('should render a no data layout when status is success', async () => {
    const screen = await renderComponent(
      <QueryFallbackLayout status="success" refetch={() => {}} />
    )

    expect(screen.getByText(appTranslation('query.noData'))).toBeInTheDocument()
  })

  it('should render an error message when status is error', async () => {
    const screen = await renderComponent(<QueryFallbackLayout status="error" refetch={() => {}} />)

    expect(screen.getByText(appTranslation('query.error'))).toBeInTheDocument()
    expect(screen.getByText(appTranslation('query.refetchButton'))).toBeInTheDocument()
  })

  it('should execute the refetch callback if the error button is clicked on', async () => {
    const user = userEvent.setup()

    let hasExecuteRefetchCallback = false

    const screen = await renderComponent(
      <QueryFallbackLayout
        status="error"
        refetch={() => {
          hasExecuteRefetchCallback = true
        }}
      />
    )

    const refetchButton = screen.getByText(appTranslation('query.refetchButton'))
    expect(refetchButton).toBeInTheDocument()

    await user.click(refetchButton)

    expect(hasExecuteRefetchCallback).toBeTruthy()
  })
})
