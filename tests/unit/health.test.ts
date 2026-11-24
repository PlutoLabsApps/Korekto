import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import healthHandler from '../../server/api/health.get'
import { isDatabaseReachable } from '../../server/utils/db'

vi.mock('../../server/utils/db', () => ({
  isDatabaseReachable: vi.fn(),
}))

function createEvent() {
  return { node: { res: { statusCode: 200 } } } as unknown as H3Event
}

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.mocked(isDatabaseReachable).mockReset()
  })

  it('returns ok when the database is reachable', async () => {
    vi.mocked(isDatabaseReachable).mockResolvedValue(true)
    const event = createEvent()

    const response = await healthHandler(event)

    expect(response).toEqual({ status: 'ok', database: 'ok' })
    expect(event.node.res.statusCode).toBe(200)
  })

  it('responds 503 when the database is unreachable', async () => {
    vi.mocked(isDatabaseReachable).mockResolvedValue(false)
    const event = createEvent()

    const response = await healthHandler(event)

    expect(response).toEqual({ status: 'error', database: 'unavailable' })
    expect(event.node.res.statusCode).toBe(503)
  })
})
