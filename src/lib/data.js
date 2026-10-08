export async function loadData() {
  const res = await fetch(`${import.meta.env.BASE_URL}data.json`, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`data.json: ${res.status}`)
  return res.json()
}

// Files uploaded in the admin but not deployed yet: path -> blob URL, so previews work before publishing.
export const localFiles = new Map()

// Relative paths live in /public; absolute, blob: and data: URLs pass through.
export const asset = (p) => {
  if (!p || /^(https?:|blob:|data:)/.test(p)) return p
  return localFiles.get(p) ?? `${import.meta.env.BASE_URL}${p}`
}
