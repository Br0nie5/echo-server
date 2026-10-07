import { LogCategory } from '@echo/utilities'
import { describe, it, expect } from 'vitest'

import { convertSelfLogToRawJsonLogLine } from '../convertSelfLogToRawJsonLogLine.js'

describe('convertSelfLogToRawJsonLogLine', () => {
  it('should build the JSON of a log line from the self log, the job and the date', () => {
    expect(
      convertSelfLogToRawJsonLogLine(
        { category: LogCategory.WARNING, message: 'bad line', callFile: 'someFile', callLine: 4 },
        5,
        new Date('2026-09-19T14:41:09.669Z')
      )
    ).toEqual({
      job_id: 5,
      timestamp: '2026-09-19T14:41:09.669Z',
      status: 'WARNING',
      message: 'bad line',
      call_file: 'someFile',
      call_line: 4
    })
  })
})
