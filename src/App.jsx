import { useEffect, useState } from 'preact/hooks'
import { Site } from './site/Site.jsx'
import { loadData } from './lib/data.js'

// Admin is a separate chunk: visitors never download it.
const loadAdmin = () => import('./admin/Admin.jsx').then((m) => m.default)

const isAdminRoute = () => location.hash.startsWith('#/admin')

export function App() {
  const [admin, setAdmin] = useState(isAdminRoute)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [Admin, setAdminComponent] = useState(null)

  useEffect(() => {
    const onHash = () => setAdmin(isAdminRoute())
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    loadData().then(setData, setError)
  }, [])

  useEffect(() => {
    if (admin && !Admin) loadAdmin().then((C) => setAdminComponent(() => C), setError)
  }, [admin])

  if (error) return <div class="center-msg">Failed to load data: {String(error.message || error)}</div>
  if (!data) return <div class="center-msg"><span class="spinner" /></div>

  if (admin) return Admin ? <Admin initialData={data} /> : <div class="center-msg"><span class="spinner" /></div>
  return <Site data={data} />
}
