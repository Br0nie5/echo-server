/**
 * Builds the snake case name made of `nameParts`: each one in lower case, its spaces replaced with
 * `_`, joined with `_`, in their order.
 *
 * Returns `undefined` when `nameParts` is empty.
 *
 * ```ts
 * createSnakeCaseName(['Billing', 'Daily Exports']) // 'billing_daily_exports'
 * createSnakeCaseName([]) // undefined
 * ```
 */
export const createSnakeCaseName = (nameParts: string[]): string | undefined =>
  nameParts.length === 0
    ? undefined
    : nameParts.map((namePart) => namePart.toLowerCase().replaceAll(' ', '_')).join('_')
