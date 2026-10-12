import { parseInteger } from '@echo/utilities'

/**
 * Parses `raw` into the port the server listens on.
 *
 * Throws when `raw` is not an integer, or is not between 1 and 65535.
 */
export const parseHttpPort = (raw: string): number => {
  const port = parseInteger(raw)
  if (port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${raw} is not between 1 and 65535`)
  }
  return port
}
