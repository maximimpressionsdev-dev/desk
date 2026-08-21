import { getRedis } from "@/server/redis/client"
import { normalizePhone } from "@/server/notifications/phone"

export type RedisDepartment = {
  id: number
  departmentCode: string
  departmentName: string
  IsProduction?: number
  workForceType?: string | null
}

export type RedisEmployee = {
  id: number
  name: string
  callingName?: string | null
  userName?: string | null
  email?: string | null
  employeeNumber?: string | null
  nic?: string | null
  departmentId?: number | null
  departmentName?: string | null
  designationName?: string | null
  passwordHash?: string | null
  status?: string | null
  mobilePhone?: string | null
  mobile?: string | null
  phone?: string | null
  phoneNumber?: string | null
  contactNumber?: string | null
  /** Redis often stores this as a JSON string array, e.g. `["0771234567"]`. */
  phoneNumbers?: string | string[] | null
}

type Cache = {
  at: number
  departments: RedisDepartment[]
  employees: RedisEmployee[]
}

let cache: Cache | null = null
const TTL_MS = 60_000

async function readJsonList<T>(key: string): Promise<T[]> {
  const redis = getRedis()
  if (redis.status === "wait") await redis.connect()
  const raw = await redis.get(key)
  if (!raw) return []
  const parsed = JSON.parse(raw) as unknown
  return Array.isArray(parsed) ? (parsed as T[]) : []
}

export async function loadDirectory(force = false) {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache

  const [departments, employees] = await Promise.all([
    readJsonList<RedisDepartment>("departments"),
    readJsonList<RedisEmployee>("employees"),
  ])

  cache = { at: Date.now(), departments, employees }
  return cache
}

export function employeeDisplayName(emp: RedisEmployee) {
  return (emp.callingName || emp.userName || emp.name || "Employee").trim()
}

/** Real company email only — never invent a local placeholder. */
export function employeeEmail(emp: RedisEmployee) {
  const email = emp.email?.trim().toLowerCase()
  if (email && email.includes("@")) return email
  return null
}

function phoneCandidatesFromPhoneNumbers(
  value: RedisEmployee["phoneNumbers"]
): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string")
  }
  const trimmed = value.trim()
  if (!trimmed) return []
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === "string")
    }
    if (typeof parsed === "string") return [parsed]
  } catch {
    // fall through — treat as a raw phone string
  }
  return [trimmed]
}

export function employeePhone(emp: RedisEmployee) {
  const candidates = [
    emp.mobilePhone,
    emp.mobile,
    emp.phone,
    emp.phoneNumber,
    emp.contactNumber,
    ...phoneCandidatesFromPhoneNumbers(emp.phoneNumbers),
  ]
  for (const raw of candidates) {
    const phone = normalizePhone(raw)
    if (phone) return phone
  }
  return null
}

export function normalizeIdNumber(value: string) {
  return value.trim().toUpperCase().replace(/[\s-]/g, "")
}

export function findRedisEmployee(identifier: string, employees: RedisEmployee[]) {
  const needle = identifier.trim().toLowerCase()
  if (!needle) return null
  return (
    employees.find((e) => (e.userName || "").trim().toLowerCase() === needle) ||
    employees.find((e) => (e.employeeNumber || "").trim().toLowerCase() === needle) ||
    employees.find((e) => {
      const email = employeeEmail(e)
      return Boolean(email && email === needle)
    }) ||
    null
  )
}
