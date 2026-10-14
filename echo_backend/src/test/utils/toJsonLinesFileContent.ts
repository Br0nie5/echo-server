/**
 * Gives the content of a `.jsonl` file holding `lines`, one JSON line each.
 *
 * ```ts
 * toJsonLinesFileContent([{ jobId: 1, timestamp, level: 'INFO', message: 'Invoices sent.' }])
 * ```
 */
export const toJsonLinesFileContent = (lines: object[]): string =>
  lines.map((line) => `${JSON.stringify(line)}\n`).join('')
