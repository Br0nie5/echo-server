import { readFileSync } from 'fs'

import type { TlsConfig } from '../backConfig.js'

/**
 * Reads the certificate and the private key `TLS_CERT_PATH` and `TLS_KEY_PATH` point to in
 * `processEnv`.
 *
 * It is `undefined`, the server then using HTTP, when neither variable is set. Throws when only
 * one of them is set, when `serverUrl` does not use `https://`, or when one of the two files
 * cannot be read.
 */
export const parseTlsConfig = (
  processEnv: NodeJS.ProcessEnv,
  { serverUrl }: { serverUrl: string }
): TlsConfig | undefined => {
  const TLS_CERT_PATH = processEnv.TLS_CERT_PATH
  const TLS_KEY_PATH = processEnv.TLS_KEY_PATH

  if (!TLS_CERT_PATH && !TLS_KEY_PATH) {
    return undefined
  }

  if (!TLS_CERT_PATH || !TLS_KEY_PATH) {
    throw new Error('TLS_CERT_PATH and TLS_KEY_PATH must both be set to enable HTTPS')
  }

  if (new URL(serverUrl).protocol !== 'https:') {
    throw new Error('SERVER_URL must use https:// when TLS_CERT_PATH and TLS_KEY_PATH are set')
  }

  return {
    cert: readFileSync(TLS_CERT_PATH),
    key: readFileSync(TLS_KEY_PATH)
  }
}
