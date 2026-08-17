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

export function placeholderEmail(employeeNumber: string) {
  return `${employeeNumber.trim().toLowerCase()}@employee.desk.local`
}

export function employeeDisplayName(emp: RedisEmployee) {
  return (emp.callingName || emp.userName || emp.name || "Employee").trim()
}

export function employeeEmail(emp: RedisEmployee) {
  const email = emp.email?.trim().toLowerCase()
  if (email && email.includes("@")) return email
  const number = emp.employeeNumber?.trim()
  if (number) return placeholderEmail(number)
  return null
}

export function employeePhone(emp: RedisEmployee) {
  const raw =
    emp.mobilePhone ||
    emp.mobile ||
    emp.phone ||
    emp.phoneNumber ||
    emp.contactNumber ||
    null
  return normalizePhone(raw)
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
    employees.find((e) => employeeEmail(e) === needle) ||
    null
  )
}
