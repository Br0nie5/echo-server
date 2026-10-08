/** The pathname of the URL without its trailing slashes. */
export const getCleanUrlPathname = (url: URL): string => {
  return url.pathname.replace(/\/+$/, '')
}
