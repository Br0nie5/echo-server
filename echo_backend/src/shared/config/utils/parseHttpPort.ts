/**
 * Parses `HTTP_PORT`, the port the server listens on.
 *
 * Throws unless `raw` is an integer between 1 and 65535.
 */
export const parseHttpPort = (raw: string): number => {
  const port = Number(raw)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid HTTP_PORT: ${raw}`)
  }
  return port
}
