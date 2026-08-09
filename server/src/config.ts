import path from 'node:path'
import { fileURLToPath } from 'node:url'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const runtimeEnv = process.env.NODE_ENV ?? 'development'
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? (runtimeEnv === 'production' ? '' : '123456')

function resolveFromServer(value: string) {
  return path.isAbsolute(value) ? value : path.resolve(serverRoot, value)
}

export const config = {
  env: runtimeEnv,
  host: process.env.HOST ?? '127.0.0.1',
  port: Number(process.env.PORT ?? 8888),
  jwtSecret: process.env.JWT_SECRET ?? 'easvue-local-development-secret-change-me',
  dbClient: process.env.DB_CLIENT ?? 'better-sqlite3',
  dbFilename: resolveFromServer(process.env.DB_FILENAME ?? './var/easvue.sqlite3'),
  databaseUrl: process.env.DATABASE_URL,
  uploadDir: resolveFromServer(process.env.UPLOAD_DIR ?? './var/uploads'),
  frontendDir: process.env.FRONTEND_DIR ? resolveFromServer(process.env.FRONTEND_DIR) : undefined,
  seedAdminUsername: process.env.SEED_ADMIN_USERNAME ?? 'admin',
  seedAdminPassword,
  seedForcePasswordChange: process.env.SEED_FORCE_PASSWORD_CHANGE === 'true'
}

if (config.env === 'production' && config.jwtSecret.length < 32) {
  throw new Error('Production JWT_SECRET must contain at least 32 characters')
}

if (config.env === 'production' && config.seedAdminPassword.length < 12) {
  throw new Error('Production SEED_ADMIN_PASSWORD must contain at least 12 characters')
}
