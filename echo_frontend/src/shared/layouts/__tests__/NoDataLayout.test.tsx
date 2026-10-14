import { renderComponent } from '../../../test/renderComponent'
import { appTranslation } from '../../../test/utils/appTranslation'
import { NoDataLayout } from '../NoDataLayout'

describe('NoDataLayout', () => {
  it('Should say there is nothing to display', () => {
    const screen = renderComponent(<NoDataLayout />)

    expect(screen.getByText(appTranslation('query.noData'))).toBeInTheDocument()
  })
})
