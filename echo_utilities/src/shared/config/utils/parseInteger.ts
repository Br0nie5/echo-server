/**
 * Parses `raw` into an integer.
 *
 * `raw` is made of digits only, after an optional minus sign. Throws on anything else (a decimal,
 * an exponent, a space, an empty text), and on an integer too far from zero to be read exactly
 * (beyond `Number.MAX_SAFE_INTEGER`).
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

  const integer = Number(raw)

  if (!Number.isSafeInteger(integer)) {
    throw new Error(`Invalid integer: ${raw} is out of range`)
  }

  // '-0' is read as -0, which is not the 0 a caller compares it to with Object.is
  return integer === 0 ? 0 : integer
}
