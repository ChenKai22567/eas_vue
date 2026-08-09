import fs from 'node:fs'
import path from 'node:path'
import knex, { type Knex } from 'knex'
import { config } from './config.js'

let instance: Knex | undefined

export function getDb(): Knex {
  if (instance) return instance

  if (config.dbClient === 'mysql2') {
    if (!config.databaseUrl) throw new Error('DATABASE_URL is required for mysql2')
    instance = knex({
      client: 'mysql2',
      connection: config.databaseUrl,
      pool: { min: 0, max: 10 }
    })
    return instance
  }

  fs.mkdirSync(path.dirname(config.dbFilename), { recursive: true })
  instance = knex({
    client: 'better-sqlite3',
    connection: { filename: config.dbFilename },
    useNullAsDefault: true,
    pool: {
      min: 1,
      max: 1,
      afterCreate(connection: { pragma: (value: string) => void }, done: (error: Error | null, connection: unknown) => void) {
        try {
          connection.pragma('foreign_keys = ON')
          connection.pragma('journal_mode = WAL')
          connection.pragma('busy_timeout = 5000')
          done(null, connection)
        } catch (error) {
          done(error as Error, connection)
        }
      }
    }
  })
  return instance
}

export async function closeDb() {
  if (instance) await instance.destroy()
  instance = undefined
}
