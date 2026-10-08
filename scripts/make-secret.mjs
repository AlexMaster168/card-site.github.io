// Usage: npm run admin:secret
// Encrypts your GitHub fine-grained token with your admin login + password
// and writes src/admin/secret.json. The token never leaves this file in plain form.
import { writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { seal, unseal } from '../src/admin/crypto.js'

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
let muted = false
rl._writeToOutput = (s) => rl.output.write(muted && !s.includes('\n') ? '' : s)

const ask = (q, hidden = false) =>
  new Promise((resolve) => {
    rl.output.write(q)
    muted = hidden
    rl.question('', (a) => {
      muted = false
      if (hidden) rl.output.write('\n')
      resolve(a.trim())
    })
  })

const login = await ask('Admin login: ')
const password = await ask('Admin password (hidden): ', true)
const repeat = await ask('Repeat password: ', true)
if (password !== repeat) throw new Error('Passwords do not match')
if (login.length < 3 || password.length < 12) {
  throw new Error('Login must be 3+ chars and password 12+ chars — the encrypted blob is public, only password strength protects it')
}
const token = await ask('GitHub fine-grained token (Contents: read & write, this repo only): ', true)
const owner = (await ask('Repo owner [AlexMaster168]: ')) || 'AlexMaster168'
const repo = (await ask('Repo name [card-site.github.io]: ')) || 'card-site.github.io'
const branch = (await ask('Branch [master]: ')) || 'master'
rl.close()

const secret = await seal(login, password, { token, owner, repo, branch })
if (!(await unseal(login, password, secret))) throw new Error('Self-check failed')
await writeFile(new URL('../src/admin/secret.json', import.meta.url), JSON.stringify(secret, null, 2) + '\n')
console.log('Saved src/admin/secret.json — commit it, then log in at <site>/#/admin')
