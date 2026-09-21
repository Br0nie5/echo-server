import path from 'path'

import { describe, it, expect, vi } from 'vitest'

import { createFilesService, type FileSystem } from '../files.service.js'

const entry = (name: string, type: 'file' | 'directory' | 'other'): object => ({
  name,
  isFile: (): boolean => type === 'file',
  isDirectory: (): boolean => type === 'directory'
})

const buildFileSystem = ({
  directories = {},
  files = {},
  unreadable = []
}: {
  directories?: Record<string, object[]>
  files?: Record<string, string>
  unreadable?: string[]
}): FileSystem =>
  ({
    readdir: vi.fn(async (directory: string) => directories[directory]),
    access: vi.fn(async (filePath: string) => {
      if (unreadable.includes(filePath)) {
        throw new Error('ENOENT')
      }
    }),
    readFile: vi.fn(async (filePath: string) => files[filePath])
  }) as unknown as FileSystem

describe('FilesService', () => {
  describe('getAllFilesPaths', () => {
    it('lists all files recursively', async () => {
      const filesService = createFilesService(
        buildFileSystem({
          directories: {
            '/logs': [entry('file1.txt', 'file'), entry('subdir', 'directory')],
            [path.join('/logs', 'subdir')]: [entry('file2.txt', 'file')]
          }
        })
      )

      expect(await filesService.getAllFilesPaths('/logs')).toEqual([
        path.join('/logs', 'file1.txt'),
        path.join('/logs', 'subdir', 'file2.txt')
      ])
    })

    it('ignores entries that are neither directories nor files', async () => {
      const filesService = createFilesService(
        buildFileSystem({ directories: { '/logs': [entry('socket', 'other')] } })
      )

      expect(await filesService.getAllFilesPaths('/logs')).toEqual([])
    })
  })

  describe('readFile', () => {
    it('reads file lines and ignores empty ones', async () => {
      const filesService = createFilesService(
        buildFileSystem({ files: { '/logs/file.txt': 'foo\n\nbar\n  \n' } })
      )

      expect(await filesService.readFile('/logs/file.txt')).toEqual(['foo', 'bar'])
    })

    it('throws EchoError if file does not exist or is not readable', async () => {
      const filesService = createFilesService(buildFileSystem({ unreadable: ['/logs/nope.txt'] }))

      await expect(filesService.readFile('/logs/nope.txt')).rejects.toMatchObject({
        statusCode: 500,
        message: expect.stringContaining('does not exist or is not readable')
      })
    })
  })

  describe('getFileNameWithoutExtension', () => {
    const filesService = createFilesService(buildFileSystem({}))

    it('should return a filename without the extension', () => {
      expect(filesService.getFileNameWithoutExtension('/foo/bar/test.txt')).toBe('test')
      expect(filesService.getFileNameWithoutExtension('foo/bar/test.txt')).toBe('test')
      expect(filesService.getFileNameWithoutExtension('no_ext')).toBe('no_ext')
    })
  })

  it('uses the real file system by default', async () => {
    const filesService = createFilesService()

    await expect(filesService.readFile('/does/not/exist.txt')).rejects.toMatchObject({
      statusCode: 500
    })
  })
})
