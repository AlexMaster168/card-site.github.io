import { toB64 } from './crypto.js'

const API = 'https://api.github.com'

export function createRepoClient({ token, owner, repo, branch }) {
  const base = `${API}/repos/${owner}/${repo}`

  async function gh(path, init = {}) {
    const res = await fetch(path.startsWith('http') ? path : `${base}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...init.headers,
      },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const err = new Error(`GitHub ${res.status}: ${body.message || res.statusText}`)
      err.status = res.status
      throw err
    }
    return res
  }

  return {
    owner,
    repo,
    branch,
    actionsUrl: `https://github.com/${owner}/${repo}/actions`,

    async verify() {
      const info = await (await gh('')).json()
      if (!info.permissions?.push) throw new Error('Token has no write access to the repository')
    },

    async readText(path) {
      try {
        const res = await gh(`/contents/${path}?ref=${encodeURIComponent(branch)}`, {
          headers: { Accept: 'application/vnd.github.raw+json' },
        })
        return await res.text()
      } catch (e) {
        if (e.status === 404) return null
        throw e
      }
    },

    // One atomic commit with any number of files: [{ path, bytes: Uint8Array }]
    async commitFiles(files, message) {
      const json = (r) => r.json()
      const post = (path, body) => gh(path, { method: 'POST', body: JSON.stringify(body) }).then(json)

      const ref = await gh(`/git/ref/heads/${encodeURIComponent(branch)}`).then(json)
      const parent = await gh(`/git/commits/${ref.object.sha}`).then(json)
      const tree = await Promise.all(
        files.map(async ({ path, bytes }) => {
          const blob = await post('/git/blobs', { content: toB64(bytes), encoding: 'base64' })
          return { path, mode: '100644', type: 'blob', sha: blob.sha }
        }),
      )
      const newTree = await post('/git/trees', { base_tree: parent.tree.sha, tree })
      const commit = await post('/git/commits', { message, tree: newTree.sha, parents: [ref.object.sha] })
      await gh(`/git/refs/heads/${encodeURIComponent(branch)}`, {
        method: 'PATCH',
        body: JSON.stringify({ sha: commit.sha }),
      })
      return commit.html_url
    },
  }
}
