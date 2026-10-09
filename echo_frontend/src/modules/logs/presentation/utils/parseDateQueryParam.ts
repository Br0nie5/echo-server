/**
 * Reads a date out of a query param of the URL.
 *
 * Returns `undefined` when the param is absent (`null`) or is not a date, so
 * that the caller falls back to its own default.
 */
export const parseDateQueryParam = (queryParam: string | null): Date | undefined => {
  if (queryParam === null) {
    return undefined
  }

  const date = new Date(queryParam)

  return Number.isNaN(date.getTime()) ? undefined : date
}
