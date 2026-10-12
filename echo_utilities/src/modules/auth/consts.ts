/**
 * Message of the 401 answer of the auth check when no account exists yet.
 *
 * A client tells that answer from the 401 of a missing session by comparing its message to this
 * one.
 */
export const needsSignupMessage = 'No account found.'
