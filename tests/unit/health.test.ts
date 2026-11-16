import type { H3Event } from 'h3'
import { describe, expect, it } from 'vitest'
import healthHandler from '../../server/api/health.get'

describe('GET /api/health', () => {
  it('returns the readiness payload', async () => {
    const response = await healthHandler({} as H3Event)

    expect(response).toEqual({ status: 'ok' })
  })
})
