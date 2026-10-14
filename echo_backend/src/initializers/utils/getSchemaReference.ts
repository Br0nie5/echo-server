/**
 * Gives the name the OpenAPI document refers to a JSON schema of the routes with.
 *
 * It is the `$id` the schema was registered with, which the document would otherwise replace with
 * a number, and `def-<index>` for a schema that has none, `index` being its position among the
 * schemas of the document.
 *
 * ```ts
 * getSchemaReference({ $id: 'Log' }, 0) // 'Log'
 * getSchemaReference({}, 3) // 'def-3'
 * ```
 */
export const getSchemaReference = (jsonSchema: { $id?: unknown }, index: number): string =>
  jsonSchema.$id?.toString() || `def-${index}`
