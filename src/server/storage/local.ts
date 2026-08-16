import { mkdir, writeFile, readFile, unlink } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

function uploadRoot() {
  const configured = process.env.UPLOAD_DIR || "uploads"
  return path.isAbsolute(configured)
    ? configured
    : path.join(/*turbopackIgnore: true*/ process.cwd(), configured)
}

export function maxUploadBytes() {
  return Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024)
}

export async function saveUpload(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer())
  if (bytes.byteLength > maxUploadBytes()) {
    throw new Error(`File exceeds ${maxUploadBytes()} bytes`)
  }
  const ext = path.extname(file.name).slice(0, 20)
  const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`
  const fullPath = path.join(/*turbopackIgnore: true*/ uploadRoot(), key)
  await mkdir(path.dirname(fullPath), { recursive: true })
  await writeFile(/*turbopackIgnore: true*/ fullPath, bytes)
  return {
    storageKey: key,
    filename: file.name.slice(0, 255),
    size: bytes.byteLength,
    mime: file.type || "application/octet-stream",
  }
}

export async function readUpload(storageKey: string) {
  const fullPath = path.join(/*turbopackIgnore: true*/ uploadRoot(), storageKey)
  return readFile(/*turbopackIgnore: true*/ fullPath)
}

export async function deleteUpload(storageKey: string) {
  const fullPath = path.join(/*turbopackIgnore: true*/ uploadRoot(), storageKey)
  try {
    await unlink(/*turbopackIgnore: true*/ fullPath)
  } catch {
    // ignore missing
  }
}
