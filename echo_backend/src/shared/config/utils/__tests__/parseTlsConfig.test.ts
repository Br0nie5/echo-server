import { beforeEach, describe, it, expect, vi } from 'vitest'

import { getMockFilesService } from '../../../../test/mocks/mockFilesService.js'
import { parseTlsConfig } from '../parseTlsConfig.js'

const CERT_PATH = '/certs/cert.pem'
const KEY_PATH = '/certs/key.pem'
const FILES_CONTENTS: Record<string, string> = {
  [CERT_PATH]: 'certificate',
  [KEY_PATH]: 'private key'
}

const TLS_ENV: NodeJS.ProcessEnv = { TLS_CERT_PATH: CERT_PATH, TLS_KEY_PATH: KEY_PATH }
const HTTPS_SERVER = { serverUrl: 'https://allowed-domain.com:3700' }

const filesService = getMockFilesService()

describe('parseTlsConfig', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    filesService.getFileContent.mockImplementation(async (filePath) => FILES_CONTENTS[filePath])
  })

  it('Should read cert and key file contents when both paths are set', async () => {
    expect(await parseTlsConfig(TLS_ENV, HTTPS_SERVER, filesService)).toStrictEqual({
      cert: 'certificate',
      key: 'private key'
    })
  })

  it('Should be undefined if neither TLS_CERT_PATH nor TLS_KEY_PATH are set', async () => {
    expect(await parseTlsConfig({}, HTTPS_SERVER, filesService)).toBeUndefined()
    expect(filesService.getFileContent).not.toHaveBeenCalled()
  })

  it('Should be undefined if TLS_CERT_PATH and TLS_KEY_PATH are empty', async () => {
    expect(
      await parseTlsConfig({ TLS_CERT_PATH: '', TLS_KEY_PATH: '' }, HTTPS_SERVER, filesService)
    ).toBeUndefined()
  })

  it('Should throw if only TLS_CERT_PATH is set', async () => {
    await expect(
      parseTlsConfig({ TLS_CERT_PATH: CERT_PATH }, HTTPS_SERVER, filesService)
    ).rejects.toThrow('TLS_CERT_PATH and TLS_KEY_PATH must both be set to enable HTTPS')
  })

  it('Should throw if only TLS_KEY_PATH is set', async () => {
    await expect(
      parseTlsConfig({ TLS_KEY_PATH: KEY_PATH }, HTTPS_SERVER, filesService)
    ).rejects.toThrow('TLS_CERT_PATH and TLS_KEY_PATH must both be set to enable HTTPS')
  })

  it('Should throw if SERVER_URL is not https when TLS is enabled', async () => {
    await expect(
      parseTlsConfig(TLS_ENV, { serverUrl: 'http://allowed-domain.com:3700' }, filesService)
    ).rejects.toThrow('SERVER_URL must use https:// when TLS_CERT_PATH and TLS_KEY_PATH are set')
  })

  it('Should throw the error of the files service when a file cannot be read', async () => {
    filesService.getFileContent.mockRejectedValue(new Error('ENOENT'))

    await expect(parseTlsConfig(TLS_ENV, HTTPS_SERVER, filesService)).rejects.toThrow('ENOENT')
  })
})
