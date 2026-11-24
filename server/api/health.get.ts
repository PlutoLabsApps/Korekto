import { defineEventHandler, setResponseStatus } from 'h3'
import { isDatabaseReachable } from '../utils/db'

export default defineEventHandler(async (event) => {
  if (!(await isDatabaseReachable())) {
    setResponseStatus(event, 503)
    return { status: 'error', database: 'unavailable' }
  }

  return { status: 'ok', database: 'ok' }
})
