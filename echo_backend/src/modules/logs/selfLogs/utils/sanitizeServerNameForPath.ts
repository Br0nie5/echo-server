/** Makes `name` safe to use as a single path segment: keeps letters, digits, `-`, `_` and spaces, replaces everything else (notably `/` and `..`) with `_`. `SERVER_NAME` is a free-text display value, not a path-safe identifier. */
export const sanitizeServerNameForPath = (name: string): string =>
  name.replace(/[^a-zA-Z0-9-_ ]/g, '_')
