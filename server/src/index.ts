import { createApp } from './app.js'
import { config } from './config.js'
import { getDb } from './db.js'
import { migrate } from './migrate.js'
import { seed } from './seed.js'

const db = getDb()
await migrate(db)
await seed(db)

const server = createApp().listen(config.port, config.host, () => {
  console.log(`EasVue API listening on http://${config.host}:${config.port}`)
})

const shutdown = () => {
  server.close(async () => {
    await db.destroy()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
