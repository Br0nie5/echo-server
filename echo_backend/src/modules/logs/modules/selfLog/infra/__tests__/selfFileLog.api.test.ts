import { describe, it, expect, vi } from 'vitest'

import { createSelfFileLogApi, type SelfLogFileSystem } from '../selfFileLog.api.js'

const SELF_LOGS_DIR = '/logs/server/Echo/log'

const buildFileSystem = (overrides: Partial<SelfLogFileSystem> = {}): SelfLogFileSystem =>
  ({
    mkdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    rename: vi.fn(),
    appendFile: vi.fn(),
    ...overrides
  }) as unknown as SelfLogFileSystem

describe('SelfFileLogApi', () => {
  describe('createSelfLogsDirectory', () => {
    it('should create the self-logs directory and its parents', async () => {
      const fileSystem = buildFileSystem()

      await createSelfFileLogApi('/logs', 'Echo', fileSystem).createSelfLogsDirectory()

      expect(fileSystem.mkdir).toHaveBeenCalledWith(SELF_LOGS_DIR, { recursive: true })
    })

    it('should make the server name safe for the directory path', async () => {
      const fileSystem = buildFileSystem()

      await createSelfFileLogApi('/logs', '../Docker Prod/1!', fileSystem).createSelfLogsDirectory()

      expect(fileSystem.mkdir).toHaveBeenCalledWith('/logs/server/___Docker Prod_1_/log', {
        recursive: true
      })
    })
  })

  describe('getRawSelfLogLines', () => {
    it('should return the non-blank lines of the file, in order', async () => {
      const fileSystem = buildFileSystem({
        readFile: vi.fn().mockResolvedValue('first\n\n  \nsecond\n')
      })

      const rawSelfLogLines = await createSelfFileLogApi(
        '/logs',
        'Echo',
        fileSystem
      ).getRawSelfLogLines('parseLogFile.jsonl')

      expect(fileSystem.readFile).toHaveBeenCalledWith(
        `${SELF_LOGS_DIR}/parseLogFile.jsonl`,
        'utf-8'
      )
      expect(rawSelfLogLines).toEqual(['first', 'second'])
    })

    it('should return no line when the file does not exist yet', async () => {
      const fileSystem = buildFileSystem({
        readFile: vi.fn().mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' }))
      })

      expect(
        await createSelfFileLogApi('/logs', 'Echo', fileSystem).getRawSelfLogLines('new.jsonl')
      ).toEqual([])
    })

    it('should throw when the file exists but cannot be read', async () => {
      const fileSystem = buildFileSystem({
        readFile: vi.fn().mockRejectedValue(Object.assign(new Error('denied'), { code: 'EACCES' }))
      })

      await expect(
        createSelfFileLogApi('/logs', 'Echo', fileSystem).getRawSelfLogLines('locked.jsonl')
      ).rejects.toThrow('denied')
    })
  })

  describe('replaceRawSelfLogLines', () => {
    it('should write the lines to a temporary file, then put it in place of the file', async () => {
      const steps: string[] = []
      const fileSystem = buildFileSystem({
        writeFile: vi.fn(async () => {
          steps.push('writeFile')
        }),
        rename: vi.fn(async () => {
          steps.push('rename')
        })
      })

      await createSelfFileLogApi('/logs', 'Echo', fileSystem).replaceRawSelfLogLines(
        'parseLogFile.jsonl',
        ['first', 'second']
      )

      expect(fileSystem.writeFile).toHaveBeenCalledWith(
        `${SELF_LOGS_DIR}/parseLogFile.jsonl.tmp`,
        'first\nsecond\n',
        'utf-8'
      )
      expect(fileSystem.rename).toHaveBeenCalledWith(
        `${SELF_LOGS_DIR}/parseLogFile.jsonl.tmp`,
        `${SELF_LOGS_DIR}/parseLogFile.jsonl`
      )
      expect(steps).toEqual(['writeFile', 'rename'])
    })

    it('should empty the file when there is no line', async () => {
      const fileSystem = buildFileSystem()

      await createSelfFileLogApi('/logs', 'Echo', fileSystem).replaceRawSelfLogLines(
        'parseLogFile.jsonl',
        []
      )

      expect(fileSystem.writeFile).toHaveBeenCalledWith(
        `${SELF_LOGS_DIR}/parseLogFile.jsonl.tmp`,
        '',
        'utf-8'
      )
    })
  })

  describe('deleteRawSelfLogLines', () => {
    it('should remove every line equal to one of the given lines and keep the others in order', async () => {
      const fileSystem = buildFileSystem({
        readFile: vi.fn().mockResolvedValue('first\nsecond\nthird\nsecond\n')
      })

      await createSelfFileLogApi('/logs', 'Echo', fileSystem).deleteRawSelfLogLines(
        'parseLogFile.jsonl',
        ['second', 'unknown']
      )

      expect(fileSystem.writeFile).toHaveBeenCalledWith(
        `${SELF_LOGS_DIR}/parseLogFile.jsonl.tmp`,
        'first\nthird\n',
        'utf-8'
      )
      expect(fileSystem.rename).toHaveBeenCalledWith(
        `${SELF_LOGS_DIR}/parseLogFile.jsonl.tmp`,
        `${SELF_LOGS_DIR}/parseLogFile.jsonl`
      )
    })

    it('should leave the file untouched when there is no line to delete', async () => {
      const fileSystem = buildFileSystem()

      await createSelfFileLogApi('/logs', 'Echo', fileSystem).deleteRawSelfLogLines(
        'parseLogFile.jsonl',
        []
      )

      expect(fileSystem.readFile).not.toHaveBeenCalled()
      expect(fileSystem.writeFile).not.toHaveBeenCalled()
    })
  })

  describe('appendRawSelfLogLines', () => {
    it('should append the lines to the file in a single write', async () => {
      const fileSystem = buildFileSystem()

      await createSelfFileLogApi('/logs', 'Echo', fileSystem).appendRawSelfLogLines(
        'parseLogFile.jsonl',
        ['first', 'second']
      )

      expect(fileSystem.appendFile).toHaveBeenCalledTimes(1)
      expect(fileSystem.appendFile).toHaveBeenCalledWith(
        `${SELF_LOGS_DIR}/parseLogFile.jsonl`,
        'first\nsecond\n',
        'utf-8'
      )
    })
  })
})
