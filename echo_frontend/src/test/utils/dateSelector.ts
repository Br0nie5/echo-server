import type { RenderResult } from '@testing-library/react'

/** A part of the date displayed by a `DateSelector`, named as its field announces it. */
type DateSectionName = 'Month' | 'Day' | 'Year'

/**
 * Finds one part of the date displayed by the `DateSelector` of the screen.
 *
 * Click it before typing or pressing an arrow key to change that part:
 *
 * ```ts
 * await user.click(getDateSection(screen, 'Day'))
 * await user.keyboard('{ArrowUp}')
 * ```
 */
export const getDateSection = (screen: RenderResult, sectionName: DateSectionName): HTMLElement =>
  screen.getByRole('spinbutton', { name: sectionName })

/**
 * Expects the `DateSelector` of the screen to display the day of `date`.
 *
 * ```ts
 * expectDateToBeSelected(screen, new Date(2026, 2, 10))
 * ```
 */
export const expectDateToBeSelected = (screen: RenderResult, date: Date): void => {
  expect(getDateSection(screen, 'Month')).toHaveAttribute('aria-valuenow', `${date.getMonth() + 1}`)
  expect(getDateSection(screen, 'Day')).toHaveAttribute('aria-valuenow', `${date.getDate()}`)
  expect(getDateSection(screen, 'Year')).toHaveAttribute('aria-valuenow', `${date.getFullYear()}`)
}
