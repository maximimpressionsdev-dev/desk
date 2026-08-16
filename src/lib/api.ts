async function parseJson(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

export const api = {
  get: async (url: string) => parseJson(await fetch(url)),
  post: async (url: string, body?: unknown) =>
    parseJson(
      await fetch(url, {
        method: "POST",
        headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
        body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
      })
    ),
  patch: async (url: string, body?: unknown) =>
    parseJson(
      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      })
    ),
  delete: async (url: string, body?: unknown) =>
    parseJson(
      await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      })
    ),
}
