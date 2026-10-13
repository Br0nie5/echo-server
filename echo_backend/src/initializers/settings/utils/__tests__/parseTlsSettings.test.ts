import { beforeEach, describe, it, expect, vi } from 'vitest'

import { getMockFilesService } from '../../../../test/mocks/mockFilesService.js'
import { parseTlsSettings } from '../parseTlsSettings.js'

const CERT_PATH = '/certs/cert.pem'
const KEY_PATH = '/certs/key.pem'
const FILES_CONTENTS: Record<string, string> = {
  [CERT_PATH]: 'certificate',
  [KEY_PATH]: 'private key'
}

const TLS_ENV: NodeJS.ProcessEnv = { TLS_CERT_PATH: CERT_PATH, TLS_KEY_PATH: KEY_PATH }

const filesService = getMockFilesService()

describe('parseTlsSettings', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    filesService.getFileContent.mockImplementation(async (filePath) => FILES_CONTENTS[filePath])
  })

  it('Should read cert and key file contents when both paths are set', async () => {
    expect(await parseTlsSettings(TLS_ENV, filesService)).toStrictEqual({
      cert: 'certificate',
      key: 'private key'
    })
  })

  it('Should be undefined if neither TLS_CERT_PATH nor TLS_KEY_PATH are set', async () => {
    expect(await parseTlsSettings({}, filesService)).toBeUndefined()
    expect(filesService.getFileContent).not.toHaveBeenCalled()
  })

  it('Should be undefined if TLS_CERT_PATH and TLS_KEY_PATH are empty', async () => {
    expect(
      await parseTlsSettings({ TLS_CERT_PATH: '', TLS_KEY_PATH: '' }, filesService)
    ).toBeUndefined()
  })

  it('Should throw if only TLS_CERT_PATH is set', async () => {
    await expect(parseTlsSettings({ TLS_CERT_PATH: CERT_PATH }, filesService)).rejects.toThrow(
      'TLS_CERT_PATH and TLS_KEY_PATH must both be set to enable HTTPS'
    )
  })

  it('Should throw if only TLS_KEY_PATH is set', async () => {
    await expect(parseTlsSettings({ TLS_KEY_PATH: KEY_PATH }, filesService)).rejects.toThrow(
      'TLS_CERT_PATH and TLS_KEY_PATH must both be set to enable HTTPS'
    )
  })

  it('Should throw the error of the files service when a file cannot be read', async () => {
    filesService.getFileContent.mockRejectedValue(new Error('ENOENT'))

    await expect(parseTlsSettings(TLS_ENV, filesService)).rejects.toThrow('ENOENT')
  })
})
