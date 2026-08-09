import crypto from 'node:crypto'
import fs from 'node:fs'
import { createRequire } from 'node:module'

const appRoot = '/www/wwwroot/easvue.624work.club/current/server'
const sharedRoot = '/www/wwwroot/easvue.624work.club/shared'
const envPath = `${sharedRoot}/easvue.env`
const bootstrapPath = `${sharedRoot}/.bootstrap-password`

const require = createRequire(`${appRoot}/package.json`)
const bcrypt = require('bcryptjs')
const Database = require('better-sqlite3')

const parseEnv = source => Object.fromEntries(
  source
    .split(/\r?\n/)
    .filter(line => line && !line.trimStart().startsWith('#'))
    .map(line => {
      const separator = line.indexOf('=')
      return separator < 0 ? [line, ''] : [line.slice(0, separator), line.slice(separator + 1)]
    })
)

const replaceEnvValue = (source, key, value) => {
  const line = `${key}=${value}`
  const pattern = new RegExp(`^${key}=.*$`, 'm')
  return pattern.test(source) ? source.replace(pattern, line) : `${source.trimEnd()}\n${line}\n`
}

const envSource = fs.readFileSync(envPath, 'utf8')
const env = parseEnv(envSource)
const databasePath = env.DB_FILENAME
const adminUsername = env.SEED_ADMIN_USERNAME || 'admin'

if (!databasePath) throw new Error('DB_FILENAME is missing from the EasVue environment file')

const requestedCredential = process.env.EASVUE_BOOTSTRAP_PASSWORD
if (requestedCredential && (requestedCredential.length < 6 || requestedCredential.length > 128)) {
  throw new Error('EASVUE_BOOTSTRAP_PASSWORD must contain 6 to 128 characters')
}

const credential = requestedCredential || crypto.randomBytes(24).toString('base64url')
const passwordHash = bcrypt.hashSync(credential, 12)
const database = new Database(databasePath)

try {
  const update = database.prepare(`
    UPDATE users
    SET password_hash = ?, force_password_change = 1,
        token_version = token_version + 1, updated_at = CURRENT_TIMESTAMP
    WHERE username = ?
  `).run(passwordHash, adminUsername)

  if (update.changes !== 1) throw new Error('The administrator account was not updated')
} finally {
  database.close()
}

if (!requestedCredential) {
  fs.writeFileSync(envPath, replaceEnvValue(envSource, 'SEED_ADMIN_PASSWORD', credential), { mode: 0o600 })
}
fs.writeFileSync(bootstrapPath, `${credential}\n`, { mode: 0o600 })
fs.chmodSync(envPath, 0o600)
fs.chmodSync(bootstrapPath, 0o600)

process.stdout.write('Bootstrap credential rotated; all existing administrator tokens were invalidated.\n')
