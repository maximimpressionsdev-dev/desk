import { compare, hash } from "bcryptjs"
import { createHash, randomBytes } from "crypto"

const ROUNDS = 12

export async function hashPassword(password: string) {
  return hash(password, ROUNDS)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash)
}

export function createToken() {
  return randomBytes(32).toString("hex")
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}
