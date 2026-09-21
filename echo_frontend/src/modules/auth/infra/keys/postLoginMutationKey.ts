/** Mutation key of the login: `[url, method]`. */
export type LoginMutationKeyType = readonly ['/auth/login', 'POST']

export const postLoginMutationKey: LoginMutationKeyType = [`/auth/login`, 'POST']
