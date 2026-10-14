import { describe, it, expect } from 'vitest'

import { parseSelfReportsRootDirPath } from '../parseSelfReportsRootDirPath.js'

describe('parseSelfReportsRootDirPath', () => {
  it.each([
    { reason: 'next to the logs directory', raw: '/self_reports', logsDirPath: '/watched_logs' },
    {
      reason: 'that only starts like the logs directory',
      raw: '/watched_logs_reports',
      logsDirPath: '/watched_logs'
    },
    {
      reason: 'holding the logs directory, the server having a directory of its own',
      raw: '/srv',
      logsDirPath: '/srv/watched_logs'
    },
    { reason: 'relative, out of the logs directory', raw: 'self_reports', logsDirPath: 'logs' }
  ])('Should give a directory $reason as it is', ({ raw, logsDirPath }) => {
    expect(parseSelfReportsRootDirPath(raw, { serverName: 'Echo', logsDirPath })).toBe(raw)
  })

  it.each([
    { reason: 'the logs directory', raw: '/watched_logs', serverName: 'Echo' },
    { reason: 'below the logs directory', raw: '/watched_logs/self_reports', serverName: 'Echo' },
    {
      reason: 'below the logs directory, whose name starts with two dots',
      raw: '/watched_logs/..reports',
      serverName: 'Echo'
    },
    {
      reason: 'the logs directory once relative paths are resolved',
      raw: '/srv/../watched_logs/./reports',
      serverName: 'Echo'
    },
    {
      reason: 'holding the logs directory as the directory of the server',
      raw: '/',
      serverName: 'watched_logs'
    }
  ])('Should throw on a directory $reason', ({ raw, serverName }) => {
    expect(() =>
      parseSelfReportsRootDirPath(raw, { serverName, logsDirPath: '/watched_logs' })
    ).toThrow(
      `Invalid self-reports directory: ${raw}, the self reports of ${serverName} would be ` +
        'stored in the logs directory, /watched_logs, and read as logs'
    )
  })
})
