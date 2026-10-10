import axios, { type AxiosError } from 'axios'

/**
 * Tells whether `error` is the error of a request the API answered with a 401.
 *
 * `TData` is the type of the body of that answer.
 *
 * ```ts
 * if (isUnauthorizedError<AuthToken>(error)) {
 *   const message = error.response?.data.message
 * }
 * ```
 */
export const isUnauthorizedError = <TData = unknown>(error: unknown): error is AxiosError<TData> =>
  axios.isAxiosError<TData>(error) && error.response?.status === 401
