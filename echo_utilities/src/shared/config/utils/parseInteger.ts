/**
 * Parses `raw` into an integer.
 *
 * `raw` is made of digits only, after an optional minus sign. Throws on anything else: a decimal,
 * an exponent, a space, an empty text.
 *
 * ```ts
 * parseInteger('14') // 14
 * parseInteger('-3') // -3
 * ```
 */
export const parseInteger = (raw: string): number => {
  if (!/^-?\d+$/.test(raw)) {
    throw new Error(`Invalid integer: ${raw} is not an integer`)
  }
  return Number(raw)
}
