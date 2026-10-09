import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import { memo, useState, type JSX } from 'react'

import type { ControlledState } from '../types/controlledState'

type DateSelectorProps = {
  /** The text displayed above the field. */
  label?: string
  /** The earliest day that can be selected. */
  minimalDate?: Date
  /** The latest day that can be selected. */
  maximalDate?: Date
  /** The selected day, held by the parent. */
  controlledState?: ControlledState<Date>
}

const DateSelectorComponent = ({
  label,
  minimalDate,
  maximalDate,
  controlledState
}: DateSelectorProps): JSX.Element => {
  const [uncontrolledSelectedDate, setUncontrolledSelectedDate] = useState<Date>()

  const selectedDate =
    controlledState !== undefined ? controlledState.value : uncontrolledSelectedDate

  const selectDate = (date: Date): void => {
    if (controlledState !== undefined) {
      controlledState.setValue(date)
    } else {
      setUncontrolledSelectedDate(date)
    }
  }

  return (
    <DatePicker
      label={label}
      sx={{ flexShrink: 1 }}
      value={selectedDate !== undefined ? dayjs(selectedDate) : null}
      minDate={minimalDate !== undefined ? dayjs(minimalDate) : undefined}
      maxDate={maximalDate !== undefined ? dayjs(maximalDate) : undefined}
      onChange={(value) => {
        if (value?.isValid()) {
          const newDate = value.toDate()
          newDate.setHours(0, 0, 0, 0)
          selectDate(newDate)
        }
      }}
    />
  )
}

/**
 * A date field with a calendar, selecting one day.
 *
 * Every prop is optional. A selected day is a `Date` at the first instant of
 * that day in the time zone of the user, so that a filter starting from it
 * includes the whole day.
 *
 * Without `controlledState`, the component holds its selection itself,
 * starting with no day selected, and its parent is not told about it:
 *
 * ```tsx
 * <DateSelector label="From" />
 * ```
 *
 * With `controlledState`, the parent holds the selection and the component
 * keeps none of its own: it displays `controlledState.value` and gives the new
 * day to `controlledState.setValue` each time the user selects one.
 *
 * ```tsx
 * const [fromDate, setFromDate] = useState<Date>(new Date())
 *
 * <DateSelector
 *   label="From"
 *   controlledState={{ value: fromDate, setValue: setFromDate }}
 * />
 * ```
 *
 * A field left empty or incomplete selects nothing: the last selected day is
 * kept.
 */
export const DateSelector = memo(DateSelectorComponent)
