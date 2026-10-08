/** Whether a request `Origin` header belongs to the allowed domain (or one of its subdomains). */
export const isOriginAllowed = (origin: string, allowedDomain: string): boolean => {
  if (allowedDomain === 'localhost') {
    return true
  }

  const { hostname } = new URL(origin)

  return hostname === allowedDomain || hostname.endsWith(`.${allowedDomain}`)
}
