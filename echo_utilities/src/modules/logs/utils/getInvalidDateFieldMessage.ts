/**
 * Gives the message telling the client that `fieldName`, a date field of a request, is not an ISO
 * date.
 *
 * ```ts
 * getInvalidDateFieldMessage('fromDate') // 'Field fromDate is not a valid date, it should be an ISO string'
 * ```
 */
export const getInvalidDateFieldMessage = (fieldName: string): string =>
  `Field ${fieldName} is not a valid date, it should be an ISO string`
