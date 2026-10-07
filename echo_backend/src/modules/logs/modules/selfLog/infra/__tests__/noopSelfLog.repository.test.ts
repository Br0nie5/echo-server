import { LogCategory } from '@echo/utilities'
import { describe, expect, it } from 'vitest'

import { createNoopSelfLogRepository } from '../noopSelfLog.repository.js'

describe('createNoopSelfLogRepository', () => {
  it('should store nothing', async () => {
    const selfLogRepository = createNoopSelfLogRepository()

    await expect(
      selfLogRepository.saveSelfLogs([
        { category: LogCategory.WARNING, message: 'bad line', callFile: 'someFile', callLine: 3 }
      ])
    ).resolves.toBeUndefined()
  })
})
