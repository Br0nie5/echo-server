import { parse } from 'tldts'

/** Registrable domain of the URL (`api.example.com` gives `example.com`), or its hostname when it has none (localhost, IP). `undefined` if the URL is invalid. */
export const getDomain = (url: string): string | undefined => {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return undefined
  }

  const { domain } = parse(parsed.hostname)
  if (domain) return domain

  // tldts couldn't extract a domain (localhost, raw IP, etc.)
  return parsed.hostname
}
