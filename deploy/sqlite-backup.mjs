import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const requireFromServer = createRequire(new URL('../server/package.json', import.meta.url))
const Database = requireFromServer('better-sqlite3')

const sourcePath = process.env.DB_FILENAME
const backupDir = process.env.BACKUP_DIR ?? '/www/backup/easvue'
const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS ?? 14)

if (!sourcePath || !path.isAbsolute(sourcePath)) throw new Error('DB_FILENAME must be an absolute path')
if (!path.isAbsolute(backupDir)) throw new Error('BACKUP_DIR must be an absolute path')

await fs.mkdir(backupDir, { recursive: true })
const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
const finalPath = path.join(backupDir, `easvue-${timestamp}.sqlite3`)
const temporaryPath = `${finalPath}.partial`

const source = new Database(sourcePath, { readonly: true, fileMustExist: true })
try {
  await source.backup(temporaryPath)
} finally {
  source.close()
}

const restored = new Database(temporaryPath, { readonly: true, fileMustExist: true })
try {
  const result = restored.pragma('integrity_check', { simple: true })
  if (result !== 'ok') throw new Error(`Backup integrity check failed: ${result}`)
  restored.prepare('SELECT COUNT(*) AS count FROM users').get()
} finally {
  restored.close()
}

await fs.rename(temporaryPath, finalPath)

const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
for (const entry of await fs.readdir(backupDir, { withFileTypes: true })) {
  if (!entry.isFile() || !/^easvue-\d{8}T\d{6}Z\.sqlite3$/.test(entry.name)) continue
  const candidate = path.join(backupDir, entry.name)
  if ((await fs.stat(candidate)).mtimeMs < cutoff) await fs.unlink(candidate)
}

console.log(`Verified SQLite backup created: ${path.basename(finalPath)}`)
