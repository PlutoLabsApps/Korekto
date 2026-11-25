# Authentication

Email and password login with two roles, `teacher` and `student`, built on [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils).

| Path                                  | Purpose                                                          |
| ------------------------------------- | ---------------------------------------------------------------- |
| `shared/utils/auth.ts`                | Roles, length limits, `registerSchema`, `loginSchema`            |
| `server/api/auth/register.post.ts`    | `POST /api/auth/register`                                        |
| `server/api/auth/login.post.ts`       | `POST /api/auth/login`                                           |
| `server/utils/auth.ts`                | `requireUser`, `requireRole`, `startUserSession`, `toPublicUser` |
| `server/plugins/session.ts`           | Validates sessions returned by `GET /api/_auth/session`          |
| `app/middleware/{auth,guest,role}.ts` | Page access                                                      |
| `app/composables/useApiError.ts`      | Translates validation and API errors                             |

## How it works

- Passwords are hashed with scrypt (`hashPassword`). Emails are trimmed and lowercased.
- After register or login the server sets the `nuxt-auth-session` cookie: the session data, encrypted with a key derived from `NUXT_APP_SECRET`. `HttpOnly`, `Secure`, `SameSite=Lax`, 30 days. There is no sessions table.
- The session holds `user` (`id`, `name`, `email`, `role`) and `secure.sessionVersion`. `GET /api/_auth/session` returns everything except `secure`.
- Every check (`requireUser`, `requireRole`, and `GET /api/_auth/session` through the plugin) loads the user from the database and compares `users.session_version` with the session. A deleted user or a changed version gets 401 and the cookie is cleared.
- Login returns the same 401 for unknown emails and wrong passwords and verifies a dummy hash for unknown emails, so responses don't reveal which accounts exist.
- Logout is `DELETE /api/_auth/session` (`useUserSession().clear()`). It removes the cookie in that browser only.

## Protecting an endpoint

```ts
export default defineEventHandler(async (event) => {
  const teacher = await requireRole(event, 'teacher') // 401 / 403
  const input = await readValidatedJson(event, createClassSchema) // 400
  // ...
})
```

Use `requireUser(event)` when any logged-in user is allowed. Both return the database user without `passwordHash`. Return users to the client only through `toPublicUser`. Page middleware is a convenience; the endpoint check is what enforces access.

## Protecting a page

```ts
definePageMeta({ middleware: 'auth' }) // logged-in users
definePageMeta({ middleware: ['auth', 'role'], role: 'teacher' }) // teachers only
definePageMeta({ middleware: 'guest' }) // logged-out users (login, register)
```

`auth` redirects to `/login?redirect=<path>` and login returns there afterwards. In components, `useUserSession()` gives `loggedIn`, `user`, `fetch()` and `clear()`.

## Forms

See `app/pages/login.vue`:

1. Validate with the shared schema: `schema.safeParse(form)`. On failure, show `fromZodError(result.error)` and stop.
2. Send `result.data` with `$fetch`.
3. On error, `fromFetchError(error)` returns `formError` and `fieldErrors`, already translated.
4. After login or register, call `useUserSession().fetch()` before navigating.

Validation messages and API errors are i18n keys (`validation.*`, `errors.*`) defined in `i18n/locales/cs.json` and `en.json`.

## Operations

- **Log a user out everywhere:** `UPDATE users SET session_version = session_version + 1 WHERE id = '...';` Every existing session of that user is rejected on its next request.
- **`NUXT_APP_SECRET`:** at least 32 characters (`openssl rand -hex 32`). Production refuses to start without it. Changing it logs out every user. Locally, Nuxt generates a temporary one if it is missing.
- **Plain HTTP:** the cookie is `Secure`, so browsers keep it only on `localhost` or HTTPS. Logging in from another device over `http://<lan-ip>` does not work.
