import { useEffect, useMemo, useState } from 'preact/hooks'
import secret from './secret.json'
import { unseal } from './crypto.js'
import { createRepoClient } from './github.js'
import { localFiles } from '../lib/data.js'
import { Site } from '../site/Site.jsx'
import { ProjectsTab, ProfileTab, JsonTab } from './tabs.jsx'

const DATA_PATH = 'public/data.json'
const serialize = (d) => JSON.stringify(d, null, 2) + '\n'

export default function Admin({ initialData }) {
  const [client, setClient] = useState(null)

  useEffect(() => {
    document.title = 'Admin'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.append(meta)
    return () => meta.remove()
  }, [])

  if (!secret.data) return <NotConfigured />
  if (!client) return <Login onLogin={setClient} />
  return <Dashboard client={client} initialData={initialData} onLogout={() => setClient(null)} />
}

function NotConfigured() {
  return (
    <div class="admin-center">
      <div class="admin-card">
        <h1>Admin is not configured</h1>
        <p>Run <code>npm run admin:secret</code>, commit <code>src/admin/secret.json</code> and redeploy.</p>
        <a href="#top" class="btn">← Back to site</a>
      </div>
    </div>
  )
}

function Login({ onLogin }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      const creds = await unseal(form.get('login'), form.get('password'), secret)
      if (!creds) throw new Error('Wrong login or password')
      const client = createRepoClient(creds)
      await client.verify()
      onLogin(client)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div class="admin-center">
      <form class="admin-card" onSubmit={submit}>
        <h1>Admin</h1>
        <label class="field"><span>Login</span><input name="login" autocomplete="username" required autofocus /></label>
        <label class="field"><span>Password</span><input name="password" type="password" autocomplete="current-password" required /></label>
        {error && <p class="admin-error">{error}</p>}
        <button class="btn btn--primary" disabled={busy}>{busy ? 'Decrypting…' : 'Log in'}</button>
        <a href="#top" class="admin-link">← Back to site</a>
      </form>
    </div>
  )
}

function Dashboard({ client, initialData, onLogout }) {
  const [data, setData] = useState(initialData)
  const [saved, setSaved] = useState(() => serialize(initialData))
  const [pending, setPending] = useState(() => new Map()) // path in /public -> Uint8Array
  const [tab, setTab] = useState('projects')
  const [preview, setPreview] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'info'|'ok'|'error', text, link? }
  const [saving, setSaving] = useState(false)

  const current = useMemo(() => serialize(data), [data])
  const dirty = current !== saved || pending.size > 0

  // The repo is the source of truth: Pages may still be serving an older build.
  useEffect(() => {
    client.readText(DATA_PATH).then(
      (text) => {
        if (!text || text === serialize(initialData)) return
        const repoData = JSON.parse(text)
        setData(repoData)
        setSaved(serialize(repoData))
        setStatus({ type: 'info', text: 'Loaded the latest data.json from the repository (newer than the deployed site).' })
      },
      (err) => setStatus({ type: 'error', text: `Could not read data.json from the repository: ${err.message}` }),
    )
  }, [])

  useEffect(() => {
    if (!dirty) return
    const warn = (e) => e.preventDefault()
    addEventListener('beforeunload', warn)
    return () => removeEventListener('beforeunload', warn)
  }, [dirty])

  function addFile(path, bytes, type) {
    localFiles.set(path, URL.createObjectURL(new Blob([bytes], { type })))
    setPending((m) => new Map(m).set(path, bytes))
  }

  async function publish() {
    setSaving(true)
    setStatus({ type: 'info', text: 'Publishing…' })
    try {
      const text = serialize(data)
      // Only upload files that are still referenced after edits.
      const files = [...pending]
        .filter(([path]) => text.includes(JSON.stringify(path)))
        .map(([path, bytes]) => ({ path: `public/${path}`, bytes }))
      files.push({ path: DATA_PATH, bytes: new TextEncoder().encode(text) })
      const link = await client.commitFiles(files, `content: update via admin (${new Date().toISOString().slice(0, 16)})`)
      setSaved(text)
      setPending(new Map())
      setStatus({ type: 'ok', text: 'Committed. GitHub Pages will redeploy in ~1 minute.', link })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  function exportJson() {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([current], { type: 'application/json' }))
    a.download = 'data.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function logout() {
    if (dirty && !confirm('You have unpublished changes. Log out anyway?')) return
    onLogout()
  }

  if (preview) {
    return (
      <>
        <Site data={data} />
        <button class="preview-exit btn btn--primary" onClick={() => setPreview(false)}>← Back to editor</button>
      </>
    )
  }

  return (
    <div class="admin">
      <header class="admin__bar">
        <div class="admin__brand">
          <strong>Admin</strong>
          <span class="mono muted">{client.owner}/{client.repo}@{client.branch}</span>
        </div>
        <nav class="admin__tabs">
          {[['projects', 'Projects'], ['profile', 'Profile'], ['json', 'All data (JSON)']].map(([id, label]) => (
            <button class={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
        <div class="admin__actions">
          <button class="btn btn--sm" onClick={() => setPreview(true)}>Preview</button>
          <button class="btn btn--sm" onClick={exportJson}>Export</button>
          <button class="btn btn--sm btn--primary" onClick={publish} disabled={!dirty || saving}>
            {saving ? 'Publishing…' : dirty ? 'Publish changes' : 'All published'}
          </button>
          <button class="btn btn--sm btn--ghost" onClick={logout}>Log out</button>
        </div>
      </header>

      {status && (
        <div class={`admin-status admin-status--${status.type}`}>
          {status.text}
          {status.link && <> <a href={status.link} target="_blank" rel="noopener">Commit</a> · <a href={client.actionsUrl} target="_blank" rel="noopener">Deploy status</a></>}
          <button onClick={() => setStatus(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      <main class="admin__main">
        {tab === 'projects' && <ProjectsTab data={data} setData={setData} addFile={addFile} />}
        {tab === 'profile' && <ProfileTab data={data} setData={setData} addFile={addFile} />}
        {tab === 'json' && <JsonTab data={data} setData={setData} />}
      </main>
    </div>
  )
}
