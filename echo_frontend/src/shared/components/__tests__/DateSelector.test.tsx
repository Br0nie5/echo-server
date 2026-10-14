import userEvent from '@testing-library/user-event'
import { useState, type JSX } from 'react'

import { renderComponent } from '../../../test/renderComponent'
import { expectDateToBeSelected, getDateSection } from '../../../test/utils/dateSelector'
import { DateSelector } from '../DateSelector'

const label = 'From'
const resetDateButtonLabel = 'Reset date'

describe('DateSelector', () => {
  test('Should display the label', () => {
    const component = renderComponent(<DateSelector label={label} />)

    expect(component.getByRole('group', { name: label })).toBeInTheDocument()
  })

  test('Should display the date selected by the user', async () => {
    const user = userEvent.setup()
    const selectedDate = new Date(2026, 2, 10)

    const component = renderComponent(<DateSelector />)

    await user.click(getDateSection(component, 'Month'))
    await user.keyboard('03102026')

    expectDateToBeSelected(component, selectedDate)
  })

  test('Should display values from controlledState if given', async () => {
    const user = userEvent.setup()
    const initialSelectedDate = new Date(2026, 2, 10)
    const nextDaySelectedDate = new Date(2026, 2, 11)
    const resetSelectedDate = new Date(2025, 0, 5)
    const setValue = vi.fn()

    const Parent = (): JSX.Element => {
      const [selectedDate, setSelectedDate] = useState<Date>(initialSelectedDate)

      return (
        <>
          <DateSelector
            controlledState={{
              value: selectedDate,
              setValue: (newSelectedDate) => {
                setValue(newSelectedDate)
                setSelectedDate(newSelectedDate)
              }
            }}
          />
          <button onClick={() => setSelectedDate(resetSelectedDate)}>{resetDateButtonLabel}</button>
        </>
      )
    }

    const component = renderComponent(<Parent />)

    expectDateToBeSelected(component, initialSelectedDate)

    await user.click(getDateSection(component, 'Day'))
    await user.keyboard('{ArrowUp}')

    expect(setValue).toHaveBeenCalledExactlyOnceWith(nextDaySelectedDate)

    expectDateToBeSelected(component, nextDaySelectedDate)

    await user.click(component.getByText(resetDateButtonLabel))

    expectDateToBeSelected(component, resetSelectedDate)
  })

  test('Should not set the date when emptying the date field', async () => {
    const user = userEvent.setup()
    const setValue = vi.fn()

    const component = renderComponent(
      <DateSelector controlledState={{ value: new Date(2026, 2, 10), setValue }} />
    )

    await user.click(getDateSection(component, 'Day'))
    await user.keyboard('{Backspace}')
    await user.click(getDateSection(component, 'Month'))
    await user.keyboard('{Backspace}')
    await user.click(getDateSection(component, 'Year'))
    await user.keyboard('{Backspace}')

    expect(setValue).not.toHaveBeenCalled()
  })

  test('Should only allow the dates between minimalDate and maximalDate', async () => {
    const user = userEvent.setup()

    const component = renderComponent(
      <DateSelector
        label={label}
        minimalDate={new Date(2026, 2, 5)}
        maximalDate={new Date(2026, 2, 10)}
      />
    )

    await user.click(getDateSection(component, 'Month'))
    await user.keyboard('03102026')

    expect(component.getByRole('group', { name: label })).toBeValid()

    await user.click(getDateSection(component, 'Day'))
    await user.keyboard('11')

    expect(component.getByRole('group', { name: label })).toBeInvalid()

    await user.click(getDateSection(component, 'Day'))
    await user.keyboard('04')

    expect(component.getByRole('group', { name: label })).toBeInvalid()

    await user.click(getDateSection(component, 'Day'))
    await user.keyboard('05')

    expect(component.getByRole('group', { name: label })).toBeValid()
  })
})
