/**
 * Thrown when a user is not allowed to sign up.
 *
 * Its `message` says why, for whoever reads the logs of the server: the user is only told that the
 * sign up is refused.
 */
export class SignUpRefusedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SignUpRefusedError'
  }
}
