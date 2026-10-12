/**
 * Gives the test id of what `renderFakeRouterApp` displays at `path`, when it is not the tested
 * screen.
 *
 * `path` is a path below `APP_URL`, with its query string, as the app navigated to it.
 *
 * ```tsx
 * expect(await screen.findByTestId(getRouteTestId('/logs?logSearch=text'))).toBeInTheDocument()
 * ```
 */
export const getRouteTestId = (path: string): string => `route ${path}`
