import { z } from 'zod'

export const USER_ROLES = ['teacher', 'student'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const EMAIL_MAX_LENGTH = 254
export const NAME_MAX_LENGTH = 100
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(EMAIL_MAX_LENGTH, `E-mail může mít nejvýše ${EMAIL_MAX_LENGTH} znaků.`)
  .pipe(z.email('Zadejte platný e-mail.'))

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Zadejte jméno.')
    .max(NAME_MAX_LENGTH, `Jméno může mít nejvýše ${NAME_MAX_LENGTH} znaků.`),
  email: emailSchema,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Heslo musí mít alespoň ${PASSWORD_MIN_LENGTH} znaků.`)
    .max(PASSWORD_MAX_LENGTH, `Heslo může mít nejvýše ${PASSWORD_MAX_LENGTH} znaků.`),
  role: z.enum(USER_ROLES, 'Vyberte roli.'),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Zadejte heslo.').max(PASSWORD_MAX_LENGTH),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
