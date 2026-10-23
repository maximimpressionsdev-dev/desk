export function normalizePhone(value: string | null | undefined): string | null {
  if (!value?.trim()) return null

  let phone = value.trim().replace(/[\s-]/g, "")
  if (phone.startsWith("+94")) phone = `0${phone.slice(3)}`
  if (phone.startsWith("94") && phone.length === 11) phone = `0${phone.slice(2)}`
  if (/^7\d{8}$/.test(phone)) phone = `0${phone}`

  if (!/^0\d{9}$/.test(phone)) return null
  return phone
}
