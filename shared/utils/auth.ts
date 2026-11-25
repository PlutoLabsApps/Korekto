import { z } from 'zod'

export const USER_ROLES = ['teacher', 'student'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const EMAIL_MAX_LENGTH = 254
export const NAME_MAX_LENGTH = 100
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

export const AUTH_MESSAGE_PARAMS = {
  nameMax: NAME_MAX_LENGTH,
  emailMax: EMAIL_MAX_LENGTH,
  passwordMin: PASSWORD_MIN_LENGTH,
  passwordMax: PASSWORD_MAX_LENGTH,
}

const emailSchema = z
  .string('validation.emailInvalid')
  .trim()
  .toLowerCase()
  .max(EMAIL_MAX_LENGTH, 'validation.emailMax')
  .pipe(z.email('validation.emailInvalid'))

export const registerSchema = z.object({
  name: z
    .string('validation.nameRequired')
    .trim()
    .min(1, 'validation.nameRequired')
    .max(NAME_MAX_LENGTH, 'validation.nameMax'),
  email: emailSchema,
  password: z
    .string('validation.passwordRequired')
    .min(PASSWORD_MIN_LENGTH, 'validation.passwordMin')
    .max(PASSWORD_MAX_LENGTH, 'validation.passwordMax'),
  role: z.enum(USER_ROLES, 'validation.roleRequired'),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string('validation.passwordRequired')
    .min(1, 'validation.passwordRequired')
    .max(PASSWORD_MAX_LENGTH, 'validation.passwordMax'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
