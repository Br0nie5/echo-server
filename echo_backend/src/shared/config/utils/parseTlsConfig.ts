import type { FilesService } from '../../services/files.service.js'
import type { TlsConfig } from '../backConfig.js'

/**
 * Reads, through `filesService`, the certificate and the private key `TLS_CERT_PATH` and
 * `TLS_KEY_PATH` point to in `processEnv`.
 *
 * It is `undefined`, the server then using HTTP, when neither variable is set. Throws when only one
 * of them is set, or when one of the two files cannot be read.
 */
export const parseTlsConfig = async (
  processEnv: NodeJS.ProcessEnv,
  filesService: FilesService
): Promise<TlsConfig | undefined> => {
  const TLS_CERT_PATH = processEnv.TLS_CERT_PATH
  const TLS_KEY_PATH = processEnv.TLS_KEY_PATH

  if (!TLS_CERT_PATH && !TLS_KEY_PATH) {
    return undefined
  }

  if (!TLS_CERT_PATH || !TLS_KEY_PATH) {
    throw new Error('TLS_CERT_PATH and TLS_KEY_PATH must both be set to enable HTTPS')
  }

  const [cert, key] = await Promise.all([
    filesService.getFileContent(TLS_CERT_PATH),
    filesService.getFileContent(TLS_KEY_PATH)
  ])

  return { cert, key }
}
