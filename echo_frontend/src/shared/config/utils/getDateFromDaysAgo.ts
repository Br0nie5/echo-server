/**
 * Gives the first instant of the day that was `daysAgo` days ago, in the time
 * zone of the user.
 *
 * `0` gives the beginning of today. Days are counted on the calendar, whatever
 * their length: a day when the clocks change counts as one. A filter starting
 * from the returned date includes that whole day.
 *
 * ```ts
 * const today = getDateFromDaysAgo(0)
 * const twoWeeksAgo = getDateFromDaysAgo(14)
 * ```
 */
export const getDateFromDaysAgo = (daysAgo: number): Date => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(0, 0, 0, 0)
  return date
}
