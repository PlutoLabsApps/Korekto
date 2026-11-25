import { createError, readBody, type H3Event } from 'h3'
import { z } from 'zod'

export async function readValidatedJson<T extends z.ZodType>(
  event: H3Event,
  schema: T,
): Promise<z.output<T>> {
  const result = schema.safeParse(await readBody(event).catch(() => undefined))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Neplatné údaje.',
      data: { fieldErrors: z.flattenError(result.error).fieldErrors },
    })
  }
  return result.data
}
