import type { FilesService } from '../../services/files.service.js'
import type { TlsConfig } from '../backConfig.js'

/**
 * Reads, through `filesService`, the certificate and the private key `TLS_CERT_PATH` and
 * `TLS_KEY_PATH` point to in `processEnv`.
 *
 * It is `undefined`, the server then using HTTP, when neither variable is set. Throws when one of
 * them is set in development (`isDevelopment`), where the Vite dev server in front of the backend
 * serves the app and proxies the API over HTTP only. Throws too when only one of them is set, when
 * `serverUrl` does not use `https://`, or when one of the two files cannot be read.
 */
export const parseTlsConfig = async (
  processEnv: NodeJS.ProcessEnv,
  { serverUrl, isDevelopment }: { serverUrl: string; isDevelopment: boolean },
  filesService: FilesService
): Promise<TlsConfig | undefined> => {
  const TLS_CERT_PATH = processEnv.TLS_CERT_PATH
  const TLS_KEY_PATH = processEnv.TLS_KEY_PATH

  if (!TLS_CERT_PATH && !TLS_KEY_PATH) {
    return undefined
  }

  if (isDevelopment) {
    throw new Error(
      'TLS_CERT_PATH and TLS_KEY_PATH cannot be set in development: the Vite dev server serves ' +
        'the app and proxies the API over HTTP only. Unset them, or set NODE_ENV=production to ' +
        'serve HTTPS from the backend.'
    )
  }

  if (!TLS_CERT_PATH || !TLS_KEY_PATH) {
    throw new Error('TLS_CERT_PATH and TLS_KEY_PATH must both be set to enable HTTPS')
  }

  if (new URL(serverUrl).protocol !== 'https:') {
    throw new Error('SERVER_URL must use https:// when TLS_CERT_PATH and TLS_KEY_PATH are set')
  }

  const [cert, key] = await Promise.all([
    filesService.getFileContent(TLS_CERT_PATH),
    filesService.getFileContent(TLS_KEY_PATH)
  ])

  return { cert, key }
}
