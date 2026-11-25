import { integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH, USER_ROLES } from '../../shared/utils/auth'

export const userRole = pgEnum('user_role', USER_ROLES)

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: EMAIL_MAX_LENGTH }).notNull().unique(),
  passwordHash: text().notNull(),
  name: varchar({ length: NAME_MAX_LENGTH }).notNull(),
  role: userRole().notNull(),
  sessionVersion: integer().notNull().default(1),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type User = typeof users.$inferSelect
