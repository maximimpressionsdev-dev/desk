export const SIDEBAR_COOKIE_NAME = 'sidebar_state'
export const SIDEBAR_STORAGE_KEY = 'company-tickets:sidebar-open'
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export function readSidebarOpenFromCookie(
  cookieValue: string | undefined,
  fallback = true
): boolean {
  if (cookieValue === 'true') return true
  if (cookieValue === 'false') return false
  return fallback
}

export function readSidebarOpenFromLocalStorage(fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback
  try {
    const value = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (value === 'true' || value === 'false') return value === 'true'
  } catch {
    // ignore private mode / blocked storage
  }
  return fallback
}

export function persistSidebarOpen(open: boolean): void {
  if (typeof document === 'undefined') return

  document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`

  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(open))
  } catch {
    // ignore private mode / blocked storage
  }
}

export function hasSidebarOpenCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some((entry) => entry.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
}
