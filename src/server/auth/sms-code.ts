import { randomInt } from "crypto"
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm"
import { db } from "@/server/db"
import { loginCodes, users } from "@/server/db/schema"
import { ApiError } from "@/server/auth/guards"
import { hashToken } from "@/server/auth/password"
import { sendSms } from "@/server/notifications/sms"

// Sign in with a one-time code sent by SMS to the mobile number on file (from the ERP). Codes last 10 minutes,
// allow 5 tries, and at most one is sent per minute and five per hour per person.

const CODE_TTL_MS = 10 * 60_000
const MAX_TRIES = 5

const codeHash = (userId: number, code: string) => hashToken(`login:${userId}:${code}`)

// "0771234567" -> "077 ••• 4567"
const maskPhone = (phone: string) => `${phone.slice(0, 3)} ••• ${phone.slice(-4)}`

/** The person behind an EPF number, username or email (desk or ERP login) */
export async function findUserByIdentifier(identifier: string) {
  const raw = identifier.trim()
  const needle = raw.toLowerCase()
  if (!needle) return null
  const [user] = await db
    .select()
    .from(users)
    .where(
      sql`lower(${users.employeeNumber}) = ${needle} or lower(${users.username}) = ${needle} or lower(${users.email}) = ${needle} or lower(${users.erpUser}) = ${needle}`
    )
    .limit(1)
  return user ?? null
}

export async function sendLoginCode(identifier: string): Promise<{ sentTo: string }> {
  const user = await findUserByIdentifier(identifier)
  if (!user || !user.active) throw new ApiError(404, "No active staff member has that EPF number or username.")
  if (!user.phone) throw new ApiError(400, "There's no mobile number on file for you. Ask IT to add it in the ERP.")

  const recent = await db
    .select({ createdAt: loginCodes.createdAt })
    .from(loginCodes)
    .where(and(eq(loginCodes.userId, user.id), gt(loginCodes.createdAt, new Date(Date.now() - 60 * 60_000))))
    .orderBy(desc(loginCodes.createdAt))
  if (recent[0] && Date.now() - recent[0].createdAt.getTime() < 60_000) {
    throw new ApiError(429, "A code was sent less than a minute ago. Wait a moment, then try again.")
  }
  if (recent.length >= 5) throw new ApiError(429, "Too many codes this hour. Try again later or use your password.")

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0")
  await db.insert(loginCodes).values({
    userId: user.id,
    codeHash: codeHash(user.id, code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  })
  await sendSms({ to: user.phone, text: `Your Support Desk sign-in code is ${code}. It expires in 10 minutes.` })
  return { sentTo: maskPhone(user.phone) }
}

/** The signed-in user when the code is right; null otherwise */
export async function checkLoginCode(identifier: string, code: string) {
  const user = await findUserByIdentifier(identifier)
  if (!user || !user.active || !/^\d{6}$/.test(code.trim())) return null

  const [latest] = await db
    .select()
    .from(loginCodes)
    .where(and(eq(loginCodes.userId, user.id), isNull(loginCodes.usedAt), gt(loginCodes.expiresAt, new Date())))
    .orderBy(desc(loginCodes.createdAt))
    .limit(1)
  if (!latest || latest.attempts >= MAX_TRIES) return null

  if (latest.codeHash !== codeHash(user.id, code.trim())) {
    await db.update(loginCodes).set({ attempts: latest.attempts + 1 }).where(eq(loginCodes.id, latest.id))
    return null
  }
  await db.update(loginCodes).set({ usedAt: new Date() }).where(eq(loginCodes.id, latest.id))
  return user
}
