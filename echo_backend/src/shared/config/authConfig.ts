import type { CookieSerializeOptions } from '@fastify/cookie'

/**
 * What the authentication is configured with: its session, its cookie and its limits.
 *
 * It holds nothing of how the accounts are stored.
 */
export type AuthConfig = {
  /** How long a session lasts, both its cookie and its JWT. */
  sessionDurationSeconds: number
  /**
   * Limit of the login and sign-up attempts, so passwords cannot be guessed at speed: how many
   * times credentials may be sent from one address within a time window.
   */
  credentialsAttemptsLimit: {
    maxAttempts: number
    timeWindowMilliseconds: number
  }
  /** Name of the cookie holding the JWT of the session. */
  cookieName: string
  cookieSerializeOptions: CookieSerializeOptions
}
