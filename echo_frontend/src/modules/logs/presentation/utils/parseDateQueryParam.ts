/**
 * Reads a date out of a query param of the URL, kept between `minimalDate` and `maximalDate`.
 *
 * Returns `undefined` when the param is absent (`null`) or is not a date, so that the caller falls
 * back to its own default. A date before `minimalDate` gives `minimalDate`, and one after
 * `maximalDate` gives `maximalDate`: anyone can write the param, and a bookmarked one gets older
 * each day.
 *
 * ```ts
 * const fromDate =
 *   parseDateQueryParam(searchParams.get('fromDate'), { minimalDate, maximalDate }) ??
 *   defaultFromDate
 * ```
 */
export const parseDateQueryParam = (
  queryParam: string | null,
  { minimalDate, maximalDate }: { minimalDate: Date; maximalDate: Date }
): Date | undefined => {
  if (queryParam === null) {
    return undefined
  }

  const date = new Date(queryParam)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }
  if (date < minimalDate) {
    return minimalDate
  }
  if (date > maximalDate) {
    return maximalDate
  }
  return date
}
