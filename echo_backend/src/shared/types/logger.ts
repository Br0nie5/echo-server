/**
 * Where a part of the backend writes what goes wrong without being thrown.
 *
 * It is the part of a logger the backend needs, whatever the logger behind it: the one of the
 * server (`server.log`) is one.
 */
export interface Logger {
  /** Writes `message` as an error, along with `context`, the values that tell it apart (`{ err: error }`). */
  error: (context: object, message: string) => void
}
