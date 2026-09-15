import { definePlugin } from 'nitro'
import { connectDatabase, closeDatabase } from '../plugins/mongodb'

export default definePlugin(async (nitroApp) => {
  nitroApp.hooks.hook('ready', async () => {
    try {
      await connectDatabase()
    } catch (error) {
      console.error('[mongodb] Failed to connect during startup:', error)
    }
  })

  nitroApp.hooks.hook('close', async () => {
    await closeDatabase()
  })
})
