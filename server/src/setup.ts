import { closeDb, getDb } from './db.js'
import { migrate } from './migrate.js'
import { seed } from './seed.js'

try {
  const db = getDb()
  await migrate(db)
  await seed(db)
  console.log('Database migrations and seed data are ready.')
} finally {
  await closeDb()
}
