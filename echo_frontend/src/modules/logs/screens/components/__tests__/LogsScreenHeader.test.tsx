import userEvent from '@testing-library/user-event'

import { renderComponent } from '../../../../../test/renderComponent'
import { getLogsInitialDate } from '../../utils/getLogsDates'
import { LogsScreenHeader } from '../LogsScreenHeader'

describe('LogsScreenHeader', () => {
  test('Should not call onDateChange when clearing the date field', async () => {
    const user = userEvent.setup()
    const onDateChange = vi.fn()

    const component = await renderComponent(
      <LogsScreenHeader
        date={getLogsInitialDate()}
        onDateChange={onDateChange}
        availableLogCategories={undefined}
        initialLogCategoriesFilters={[]}
        initialLogSearch=""
        setLogCategoriesFilters={() => {}}
        onSearch={() => {}}
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

    expect(onDateChange).not.toHaveBeenCalled()
  })
})
