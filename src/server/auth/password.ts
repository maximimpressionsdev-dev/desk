import { createHmac, createHash, randomBytes } from "crypto"
import { compare, hash } from "bcryptjs"

const ROUNDS = 10

function authSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "nextauth_secret_key"
}

function hmacPassword(password: string) {
  return createHmac("sha256", authSecret()).update(password).digest("hex")
}

export async function hashPassword(password: string) {
  return hash(hmacPassword(password), ROUNDS)
}

export async function verifyPassword(password: string, passwordHash: string) {
  const hmacOk = await compare(hmacPassword(password), passwordHash).catch(() => false)
  if (hmacOk) return true
  return compare(password, passwordHash).catch(() => false)
}

export function createToken() {
  return randomBytes(32).toString("hex")
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}
