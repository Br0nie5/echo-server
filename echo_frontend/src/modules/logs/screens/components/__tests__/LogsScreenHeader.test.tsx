import userEvent from '@testing-library/user-event'

import { renderComponent } from '../../../../../test/renderComponent'
import { getLogsInitialDate } from '../../utils/getLogsDates'
import { LogsScreenHeader } from '../LogsScreenHeader'

describe('LogsScreenHeader', () => {
  test('Should not set the date when clearing the date field', async () => {
    const user = userEvent.setup()
    const setLogsFromDate = vi.fn()

    const component = await renderComponent(
      <LogsScreenHeader
        logsFromDateState={{ value: getLogsInitialDate(), setValue: setLogsFromDate }}
        availableLogCategories={undefined}
        logCategoriesFiltersState={{ value: [], setValue: () => {} }}
        logSearchState={{ value: '', setValue: () => {} }}
      />
    )

    const daySpinner = component.getByRole('spinbutton', { name: 'Day' })
    const monthSpinner = component.getByRole('spinbutton', { name: 'Month' })
    const yearSpinner = component.getByRole('spinbutton', { name: 'Year' })

    await user.click(daySpinner)
    await user.keyboard('{Backspace}')
    await user.click(monthSpinner)
    await user.keyboard('{Backspace}')
    await user.click(yearSpinner)
    await user.keyboard('{Backspace}')

    expect(setLogsFromDate).not.toHaveBeenCalled()
  })
})
