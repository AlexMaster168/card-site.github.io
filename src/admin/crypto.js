// Shared by the browser admin and scripts/make-secret.mjs (Node 20+ has globalThis.crypto).
// login + password -> PBKDF2 -> AES-256-GCM key that wraps the GitHub token.
// GCM auth tag makes wrong credentials fail to decrypt, so nothing else is stored to compare against.
const ITERATIONS = 600_000
const enc = new TextEncoder()
const dec = new TextDecoder()

const toB64 = (bytes) => {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}
const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

async function deriveKey(login, password, salt, iterations) {
  const base = await crypto.subtle.importKey('raw', enc.encode(`${login}\n${password}`), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function seal(login, password, payload) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(login, password, salt, ITERATIONS)
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(payload))))
  return { v: 1, iterations: ITERATIONS, salt: toB64(salt), iv: toB64(iv), data: toB64(ct) }
}

export async function unseal(login, password, secret) {
  const key = await deriveKey(login, password, fromB64(secret.salt), secret.iterations)
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(secret.iv) }, key, fromB64(secret.data))
    return JSON.parse(dec.decode(pt))
  } catch {
    return null
  }
}

export { toB64 }
