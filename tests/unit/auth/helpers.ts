import { createApp, send, setResponseStatus, toWebHandler, type EventHandler } from 'h3'

export async function callHandler(handler: EventHandler, body?: unknown) {
  // Like Nitro, include `message` and `data` in error responses.
  const app = createApp({
    onError: (error, event) => {
      setResponseStatus(event, error.statusCode)
      return send(
        event,
        JSON.stringify({ statusCode: error.statusCode, message: error.message, data: error.data }),
        'application/json',
      )
    },
  }).use('/', handler)
  const response = await toWebHandler(app)(
    new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
  return { status: response.status, body: await response.json() }
}

export const dbUser = {
  id: '3f2a6c1e-0000-4000-8000-000000000001',
  name: 'Jan Novák',
  email: 'jan@skola.cz',
  passwordHash: '$scrypt$stored',
  role: 'teacher' as const,
  sessionVersion: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const publicUser = {
  id: dbUser.id,
  name: dbUser.name,
  email: dbUser.email,
  role: dbUser.role,
}
