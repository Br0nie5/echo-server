import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, it, expect, vi } from 'vitest'

import { requireAuthentication } from '../auth.hooks.js'

const mockReply = (): FastifyReply =>
  ({ status: vi.fn().mockReturnThis(), send: vi.fn() }) as unknown as FastifyReply

describe('requireAuthentication', () => {
  it('should let the request through when the JWT is valid', async () => {
    const request = { jwtVerify: vi.fn().mockResolvedValue({}) } as unknown as FastifyRequest
    const reply = mockReply()

    await requireAuthentication(request, reply)

    expect(reply.status).not.toHaveBeenCalled()
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('should replies 401 when the JWT is invalid', async () => {
    const request = {
      jwtVerify: vi.fn().mockRejectedValue(new Error('bad'))
    } as unknown as FastifyRequest
    const reply = mockReply()

    await requireAuthentication(request, reply)

    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({ statusCode: 401, message: 'Invalid token.' })
  })
})
