import type { FilesService } from '../../../shared/services/files.service.js'
import type { TlsSettings } from '../settings.js'

/**
 * Reads, through `filesService`, the certificate and the private key `TLS_CERT_PATH` and
 * `TLS_KEY_PATH` point to in `processEnv`.
 *
 * It is `undefined`, the server then using HTTP, when neither variable is set. Throws when only one
 * of them is set, or when one of the two files cannot be read.
 */
export const parseTlsSettings = async (
  processEnv: NodeJS.ProcessEnv,
  filesService: FilesService
): Promise<TlsSettings | undefined> => {
  const certificatePath = processEnv.TLS_CERT_PATH
  const privateKeyPath = processEnv.TLS_KEY_PATH

  if (!certificatePath && !privateKeyPath) {
    return undefined
  }

  if (!certificatePath || !privateKeyPath) {
    throw new Error('TLS_CERT_PATH and TLS_KEY_PATH must both be set to enable HTTPS')
  }

  const [cert, key] = await Promise.all([
    filesService.getFileContent(certificatePath),
    filesService.getFileContent(privateKeyPath)
  ])

  return { cert, key }
}
