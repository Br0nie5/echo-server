/** Query key of the auth check: `[url, method]`. */
export type GetAuthCheckQueryKeyType = readonly ['/auth/check', 'GET']

export const getAuthCheckQueryKey: GetAuthCheckQueryKeyType = [`/auth/check`, 'GET']
