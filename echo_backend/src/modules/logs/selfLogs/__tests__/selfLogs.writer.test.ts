import fs from 'node:fs/promises'

import type { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises')

import { formatDateForLog } from '../../../../shared/utils/convertToDate.js'
import { createNoopSelfLogsWriter, createSelfLogsWriter } from '../selfLogs.writer.js'

const logger = { error: vi.fn() } as unknown as FastifyBaseLogger

const SELF_LOGS_DIR = '/logs/server/Echo/log'

/** `fs.readdir`'s real signature is overloaded on `withFileTypes` (`string[]` vs `Dirent[]`); the writer only ever calls the plain, no-options form, which resolves `string[]`. */
const mockReaddirOnce = (fileNames: string[]): void => {
  vi.mocked(fs.readdir).mockResolvedValueOnce(fileNames as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createNoopSelfLogsWriter', () => {
  it('should treat no file as a self-log file and do nothing on logParseFailures', async () => {
    const writer = createNoopSelfLogsWriter()

    expect(writer.isSelfLogFile(`${SELF_LOGS_DIR}/parseLogFile.jsonl`)).toBe(false)
    await expect(
      writer.logParseFailures([{ rawLogLine: 'some line', lineIndex: 1 }], 'self.jsonl', 'file')
    ).resolves.toBeUndefined()
    expect(fs.appendFile).not.toHaveBeenCalled()
  })
})

describe('createSelfLogsWriter', () => {
  const options = {
    logsDirPath: '/logs',
    serverName: 'Echo',
    retentionDays: 10,
    sessionJobId: 5,
    logger
  }

  it('should create the self-logs directory', async () => {
    mockReaddirOnce([])

    await createSelfLogsWriter(options)

    expect(fs.mkdir).toHaveBeenCalledWith(SELF_LOGS_DIR, { recursive: true })
  })

  describe('isSelfLogFile', () => {
    it('should recognize a file directly inside the self-logs directory', async () => {
      mockReaddirOnce([])
      const writer = await createSelfLogsWriter(options)

      expect(writer.isSelfLogFile(`${SELF_LOGS_DIR}/parseLogFile.jsonl`)).toBe(true)
      expect(writer.isSelfLogFile(`${SELF_LOGS_DIR}/anyOtherModule.jsonl`)).toBe(true)
    })

    it('should not recognize a file outside the self-logs directory', async () => {
      mockReaddirOnce([])
      const writer = await createSelfLogsWriter(options)

      expect(writer.isSelfLogFile('/logs/docker/utils/file.jsonl')).toBe(false)
    })

    it('should sanitize the server name used in the directory path', async () => {
      mockReaddirOnce([])

      const writer = await createSelfLogsWriter({ ...options, serverName: 'Docker Prod/1' })

      expect(writer.isSelfLogFile('/logs/server/Docker Prod_1/log/parseLogFile.jsonl')).toBe(true)
    })
  })

  it('should do nothing when the directory has no existing jsonl files', async () => {
    mockReaddirOnce(['notes.txt'])

    await createSelfLogsWriter(options)

    expect(fs.readFile).not.toHaveBeenCalled()
    expect(fs.writeFile).not.toHaveBeenCalled()
  })

  it('should prune lines older than retentionDays and keep the rest, for every jsonl file', async () => {
    const oldLine = JSON.stringify({
      job_id: 1,
      timestamp: formatDateForLog(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)),
      status: 'WARNING',
      message: 'old'
    })
    const recentLine = JSON.stringify({
      job_id: 1,
      timestamp: formatDateForLog(new Date()),
      status: 'WARNING',
      message: 'recent'
    })

    mockReaddirOnce(['a.jsonl', 'b.jsonl'])
    vi.mocked(fs.readFile).mockResolvedValue(`${oldLine}\n${recentLine}\n`)

    await createSelfLogsWriter(options)

    expect(fs.readFile).toHaveBeenCalledWith(`${SELF_LOGS_DIR}/a.jsonl`, 'utf-8')
    expect(fs.readFile).toHaveBeenCalledWith(`${SELF_LOGS_DIR}/b.jsonl`, 'utf-8')
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${SELF_LOGS_DIR}/a.jsonl`,
      `${recentLine}\n`,
      'utf-8'
    )
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${SELF_LOGS_DIR}/b.jsonl`,
      `${recentLine}\n`,
      'utf-8'
    )
  })

  it('should write an empty file when every line has been pruned', async () => {
    const oldLine = JSON.stringify({
      job_id: 1,
      timestamp: formatDateForLog(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)),
      status: 'WARNING',
      message: 'old'
    })

    mockReaddirOnce(['existing.jsonl'])
    vi.mocked(fs.readFile).mockResolvedValueOnce(`${oldLine}\n`)

    await createSelfLogsWriter(options)

    expect(fs.writeFile).toHaveBeenCalledWith(`${SELF_LOGS_DIR}/existing.jsonl`, '', 'utf-8')
  })

  it('should defensively keep lines it cannot read a timestamp from', async () => {
    mockReaddirOnce(['existing.jsonl'])
    vi.mocked(fs.readFile).mockResolvedValueOnce('not json\n')

    await createSelfLogsWriter(options)

    expect(fs.writeFile).toHaveBeenCalledWith(
      `${SELF_LOGS_DIR}/existing.jsonl`,
      'not json\n',
      'utf-8'
    )
  })

  it('should fall back to a no-op writer and log the error when setup fails', async () => {
    vi.mocked(fs.mkdir).mockRejectedValueOnce(new Error('EACCES'))

    const writer = await createSelfLogsWriter(options)

    expect(writer.isSelfLogFile(`${SELF_LOGS_DIR}/parseLogFile.jsonl`)).toBe(false)
    expect(logger.error).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'Failed to set up self logs, disabling them for this session'
    )

    await writer.logParseFailures([{ rawLogLine: 'a line', lineIndex: 1 }], 'self.jsonl', 'file')
    expect(fs.appendFile).not.toHaveBeenCalled()
  })

  describe('logParseFailures', () => {
    it('should do nothing when there are no failed lines', async () => {
      mockReaddirOnce([])
      const writer = await createSelfLogsWriter(options)

      await writer.logParseFailures([], 'self.jsonl', 'file')

      expect(fs.appendFile).not.toHaveBeenCalled()
      expect(fs.readFile).not.toHaveBeenCalled()
    })

    it('should append one WARNING entry per failed line, with call_file and call_line', async () => {
      mockReaddirOnce([])
      const writer = await createSelfLogsWriter(options)
      vi.mocked(fs.readFile).mockResolvedValueOnce('')

      await writer.logParseFailures(
        [
          { rawLogLine: 'bad line 1', lineIndex: 1 },
          { rawLogLine: 'bad line 2', lineIndex: 4 }
        ],
        'parseLogFile.jsonl',
        'someFile'
      )

      expect(fs.appendFile).toHaveBeenCalledTimes(1)
      const [path, content] = vi.mocked(fs.appendFile).mock.calls[0]
      expect(path).toBe(`${SELF_LOGS_DIR}/parseLogFile.jsonl`)

      const lines = (content as string)
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line))
      expect(lines).toHaveLength(2)
      expect(lines[0]).toMatchObject({
        job_id: 5,
        status: 'WARNING',
        message: 'bad line 1',
        call_file: 'someFile',
        call_line: 1
      })
      expect(lines[1]).toMatchObject({
        job_id: 5,
        status: 'WARNING',
        message: 'bad line 2',
        call_file: 'someFile',
        call_line: 4
      })
      expect(typeof lines[0].timestamp).toBe('string')
    })

    it('should treat a missing self-log file as having no prior entries', async () => {
      mockReaddirOnce([])
      const writer = await createSelfLogsWriter(options)
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('ENOENT'))

      await writer.logParseFailures(
        [{ rawLogLine: 'bad line', lineIndex: 1 }],
        'parseLogFile.jsonl',
        'someFile'
      )

      expect(fs.appendFile).toHaveBeenCalledTimes(1)
    })

    it('should skip a failure already reported with the same call_file, call_line and message', async () => {
      mockReaddirOnce([])
      const writer = await createSelfLogsWriter(options)

      const alreadyReported = JSON.stringify({
        job_id: 1,
        timestamp: formatDateForLog(),
        status: 'WARNING',
        message: 'bad line',
        call_file: 'someFile',
        call_line: 3
      })
      vi.mocked(fs.readFile).mockResolvedValueOnce(`${alreadyReported}\n`)

      await writer.logParseFailures(
        [{ rawLogLine: 'bad line', lineIndex: 3 }],
        'parseLogFile.jsonl',
        'someFile'
      )

      expect(fs.appendFile).not.toHaveBeenCalled()
    })

    it('should only append the genuinely new failures of a batch that also has duplicates', async () => {
      mockReaddirOnce([])
      const writer = await createSelfLogsWriter(options)

      const alreadyReported = JSON.stringify({
        job_id: 1,
        timestamp: formatDateForLog(),
        status: 'WARNING',
        message: 'bad line',
        call_file: 'someFile',
        call_line: 3
      })
      vi.mocked(fs.readFile).mockResolvedValueOnce(`${alreadyReported}\n`)

      await writer.logParseFailures(
        [
          { rawLogLine: 'bad line', lineIndex: 3 },
          { rawLogLine: 'new bad line', lineIndex: 7 }
        ],
        'parseLogFile.jsonl',
        'someFile'
      )

      expect(fs.appendFile).toHaveBeenCalledTimes(1)
      const [, content] = vi.mocked(fs.appendFile).mock.calls[0]
      const lines = (content as string)
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line))
      expect(lines).toHaveLength(1)
      expect(lines[0]).toMatchObject({ message: 'new bad line', call_line: 7 })
    })

    it('should treat the same message at a different call_line as a new failure', async () => {
      mockReaddirOnce([])
      const writer = await createSelfLogsWriter(options)

      const alreadyReported = JSON.stringify({
        job_id: 1,
        timestamp: formatDateForLog(),
        status: 'WARNING',
        message: 'bad line',
        call_file: 'someFile',
        call_line: 3
      })
      vi.mocked(fs.readFile).mockResolvedValueOnce(`${alreadyReported}\n`)

      await writer.logParseFailures(
        [{ rawLogLine: 'bad line', lineIndex: 9 }],
        'parseLogFile.jsonl',
        'someFile'
      )

      expect(fs.appendFile).toHaveBeenCalledTimes(1)
    })

    it('should ignore a pre-existing entry with no call_file/call_line (written before this field existed)', async () => {
      mockReaddirOnce([])
      const writer = await createSelfLogsWriter(options)

      const legacyEntry = JSON.stringify({
        job_id: 1,
        timestamp: formatDateForLog(),
        status: 'WARNING',
        message: 'bad line'
      })
      vi.mocked(fs.readFile).mockResolvedValueOnce(`${legacyEntry}\n`)

      await writer.logParseFailures(
        [{ rawLogLine: 'bad line', lineIndex: 1 }],
        'parseLogFile.jsonl',
        'someFile'
      )

      expect(fs.appendFile).toHaveBeenCalledTimes(1)
    })

    it('should ignore a stray line that is not a self-log entry when reading prior failures', async () => {
      mockReaddirOnce([])
      const writer = await createSelfLogsWriter(options)
      vi.mocked(fs.readFile).mockResolvedValueOnce('not json\n')

      await writer.logParseFailures(
        [{ rawLogLine: 'bad line', lineIndex: 1 }],
        'parseLogFile.jsonl',
        'someFile'
      )

      expect(fs.appendFile).toHaveBeenCalledTimes(1)
    })

    it('should log the error and not throw when appending fails', async () => {
      mockReaddirOnce([])
      const writer = await createSelfLogsWriter(options)
      vi.mocked(fs.readFile).mockResolvedValueOnce('')
      vi.mocked(fs.appendFile).mockRejectedValueOnce(new Error('EACCES'))

      await expect(
        writer.logParseFailures(
          [{ rawLogLine: 'bad line', lineIndex: 1 }],
          'parseLogFile.jsonl',
          'someFile'
        )
      ).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalledWith(
        { err: expect.any(Error), sourceFileName: 'someFile' },
        'Failed to write self logs'
      )
    })
  })
})
