import { useState } from 'preact/hooks'
import { asset } from '../lib/data.js'

const LANG_LABELS = { en: 'EN', uk: 'UA' }

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `project-${Date.now().toString(36)}`

const emptyProject = () => ({
  id: '',
  title: '',
  year: String(new Date().getFullYear()),
  featured: true,
  tagline: { en: '', uk: '' },
  description: { en: '', uk: '' },
  tech: [],
  github: '',
  demo: '',
  images: [],
})

// Downscale to max 1600px and re-encode as WebP so the repo stays small.
async function toWebp(file) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.82))
  return new Uint8Array(await blob.arrayBuffer())
}

function Field({ label, value, onInput, textarea, ...rest }) {
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <label class="field">
      <span>{label}</span>
      <Tag value={value ?? ''} onInput={(e) => onInput(e.currentTarget.value)} rows={textarea ? 4 : undefined} {...rest} />
    </label>
  )
}

function LField({ label, value, onChange, textarea }) {
  const v = value && typeof value === 'object' ? value : { en: value || '', uk: '' }
  return (
    <fieldset class="lfield">
      <legend>{label}</legend>
      {Object.keys(LANG_LABELS).map((code) => (
        <Field label={LANG_LABELS[code]} value={v[code]} textarea={textarea} onInput={(x) => onChange({ ...v, [code]: x })} />
      ))}
    </fieldset>
  )
}

/* ---------- Projects ---------- */

export function ProjectsTab({ data, setData, addFile }) {
  const [editing, setEditing] = useState(null) // { index: number | -1, project }
  const projects = data.projects

  const setProjects = (next) => setData({ ...data, projects: next })

  function move(i, d) {
    const j = i + d
    if (j < 0 || j >= projects.length) return
    const next = [...projects]
    ;[next[i], next[j]] = [next[j], next[i]]
    setProjects(next)
  }

  function remove(i) {
    if (!confirm(`Delete “${projects[i].title}”?`)) return
    setProjects(projects.filter((_, k) => k !== i))
  }

  function commit(project) {
    const next = [...projects]
    if (editing.index === -1) next.unshift(project)
    else next[editing.index] = project
    setProjects(next)
    setEditing(null)
  }

  if (editing) {
    return (
      <ProjectEditor
        initial={editing.project}
        takenIds={projects.filter((_, k) => k !== editing.index).map((p) => p.id)}
        addFile={addFile}
        onSave={commit}
        onCancel={() => setEditing(null)}
      />
    )
  }

  return (
    <section>
      <div class="admin__head">
        <h2>Projects <span class="muted">({projects.length})</span></h2>
        <button class="btn btn--primary btn--sm" onClick={() => setEditing({ index: -1, project: emptyProject() })}>+ Add project</button>
      </div>
      <p class="muted small">Featured projects are shown as big cards, the rest in the “More from GitHub” grid. Order here = order on the site.</p>
      <ul class="plist">
        {projects.map((p, i) => (
          <li key={p.id}>
            {p.images?.[0] ? <img src={asset(p.images[0])} alt="" /> : <div class="plist__noimg" />}
            <div class="plist__info">
              <strong>{p.title || <em>untitled</em>}</strong>
              <span class="muted small">{p.featured ? '★ featured' : 'compact'} · {p.year || '—'} · {p.tech?.join(', ')}</span>
            </div>
            <div class="plist__actions">
              <button class="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} title="Move up">↑</button>
              <button class="icon-btn" onClick={() => move(i, 1)} disabled={i === projects.length - 1} title="Move down">↓</button>
              <button class="btn btn--sm" onClick={() => setEditing({ index: i, project: structuredClone(p) })}>Edit</button>
              <button class="btn btn--sm btn--danger" onClick={() => remove(i)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ProjectEditor({ initial, takenIds, addFile, onSave, onCancel }) {
  const [p, setP] = useState(initial)
  const [techText, setTechText] = useState(initial.tech.join(', '))
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const set = (patch) => setP((cur) => ({ ...cur, ...patch }))

  async function upload(e) {
    const files = [...e.currentTarget.files]
    e.currentTarget.value = ''
    setUploading(true)
    try {
      const base = p.id || slugify(p.title)
      const paths = []
      for (const file of files) {
        const path = `uploads/${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}.webp`
        addFile(path, await toWebp(file), 'image/webp')
        paths.push(path)
      }
      setP((cur) => ({ ...cur, images: [...cur.images, ...paths] }))
    } catch (err) {
      setError(`Image processing failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  function moveImage(i, d) {
    const imgs = [...p.images]
    const j = i + d
    if (j < 0 || j >= imgs.length) return
    ;[imgs[i], imgs[j]] = [imgs[j], imgs[i]]
    set({ images: imgs })
  }

  function submit(e) {
    e.preventDefault()
    const title = p.title.trim()
    if (!title) return setError('Title is required')
    const id = p.id || slugify(title)
    if (takenIds.includes(id)) return setError(`Project id “${id}” already exists`)
    const tech = techText.split(',').map((s) => s.trim()).filter(Boolean)
    onSave({ ...p, title, id, tech })
  }

  return (
    <form class="editor" onSubmit={submit}>
      <div class="admin__head">
        <h2>{initial.title ? `Edit: ${initial.title}` : 'New project'}</h2>
        <div class="row">
          <button type="button" class="btn btn--sm" onClick={onCancel}>Cancel</button>
          <button class="btn btn--sm btn--primary">Apply</button>
        </div>
      </div>
      {error && <p class="admin-error">{error}</p>}

      <div class="grid2">
        <Field label="Title *" value={p.title} onInput={(title) => set({ title })} required />
        <Field label="Year" value={p.year} onInput={(year) => set({ year })} />
        <Field label="GitHub URL" value={p.github} onInput={(github) => set({ github })} type="url" placeholder="https://github.com/…" />
        <Field label="Live demo URL" value={p.demo} onInput={(demo) => set({ demo })} type="url" placeholder="https://…" />
      </div>
      <label class="check">
        <input type="checkbox" checked={p.featured} onChange={(e) => set({ featured: e.currentTarget.checked })} />
        Featured (big card)
      </label>
      <LField label="Tagline (one line)" value={p.tagline} onChange={(tagline) => set({ tagline })} />
      <LField label="Description" value={p.description} onChange={(description) => set({ description })} textarea />
      <Field label="Tech stack (comma separated)" value={techText} onInput={setTechText} placeholder="React, Node.js, PostgreSQL" />

      <fieldset class="lfield">
        <legend>Images (first one is the cover)</legend>
        <div class="thumbs">
          {p.images.map((src, i) => (
            <figure key={src}>
              <img src={asset(src)} alt="" />
              <figcaption>
                <button type="button" class="icon-btn" onClick={() => moveImage(i, -1)} disabled={i === 0}>←</button>
                <button type="button" class="icon-btn" onClick={() => moveImage(i, 1)} disabled={i === p.images.length - 1}>→</button>
                <button type="button" class="icon-btn icon-btn--danger" onClick={() => set({ images: p.images.filter((_, k) => k !== i) })}>✕</button>
              </figcaption>
            </figure>
          ))}
          <label class="thumbs__add">
            <input type="file" accept="image/*" multiple onChange={upload} hidden />
            {uploading ? 'Processing…' : '+ Upload'}
          </label>
        </div>
      </fieldset>
    </form>
  )
}

/* ---------- Profile ---------- */

export function ProfileTab({ data, setData, addFile }) {
  const profile = data.profile
  const set = (patch) => setData({ ...data, profile: { ...profile, ...patch } })

  async function uploadCv(e) {
    const file = e.currentTarget.files[0]
    if (!file) return
    addFile('cv.pdf', new Uint8Array(await file.arrayBuffer()), 'application/pdf')
    set({ cv: 'cv.pdf' })
  }

  return (
    <section class="editor">
      <div class="admin__head"><h2>Profile</h2></div>
      <LField label="Name" value={profile.name} onChange={(name) => set({ name })} />
      <LField label="Role / headline" value={profile.role} onChange={(role) => set({ role })} />
      <LField label="Summary" value={profile.summary} onChange={(summary) => set({ summary })} textarea />
      <LField label="Location" value={profile.location} onChange={(location) => set({ location })} />
      <div class="grid2">
        <Field label="Email" value={profile.email} onInput={(email) => set({ email })} type="email" />
        <Field label="GitHub URL" value={profile.github} onInput={(github) => set({ github })} />
        <Field label="LinkedIn URL" value={profile.linkedin} onInput={(linkedin) => set({ linkedin })} />
        <Field label="Telegram URL" value={profile.telegram} onInput={(telegram) => set({ telegram })} />
      </div>
      <label class="field">
        <span>CV (PDF) — currently <a href={asset(profile.cv)} target="_blank" rel="noopener">{profile.cv || 'none'}</a></span>
        <input type="file" accept="application/pdf" onChange={uploadCv} />
      </label>
      <p class="muted small">Stats, skills, publications, experience and education are edited in the “All data (JSON)” tab.</p>
    </section>
  )
}

/* ---------- Raw JSON ---------- */

export function JsonTab({ data, setData }) {
  const [text, setText] = useState(() => JSON.stringify(data, null, 2))
  const [msg, setMsg] = useState(null)

  function apply() {
    try {
      const next = JSON.parse(text)
      for (const key of ['profile', 'projects']) {
        if (!next[key]) throw new Error(`Missing “${key}”`)
      }
      if (!Array.isArray(next.projects)) throw new Error('“projects” must be an array')
      setData(next)
      setMsg({ ok: true, text: 'Applied. Don’t forget to publish.' })
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    }
  }

  return (
    <section class="editor">
      <div class="admin__head">
        <h2>All data</h2>
        <div class="row">
          <button class="btn btn--sm" onClick={() => setText(JSON.stringify(data, null, 2))}>Reset</button>
          <button class="btn btn--sm btn--primary" onClick={apply}>Apply JSON</button>
        </div>
      </div>
      <p class="muted small">Localized fields are objects like <code>{'{ "en": "…", "uk": "…" }'}</code>.</p>
      {msg && <p class={msg.ok ? 'admin-ok' : 'admin-error'}>{msg.text}</p>}
      <textarea class="json" value={text} onInput={(e) => setText(e.currentTarget.value)} spellcheck={false} />
    </section>
  )
}
