/** Mutation key of the sign up: `[url, method]`. */
export type SignUpMutationKeyType = readonly ['/auth/signup', 'POST']

export const postSignUpMutationKey: SignUpMutationKeyType = [`/auth/signup`, 'POST']
