import { definePlugin } from 'nitro'
import { connectDatabase, closeDatabase } from './mongodb'

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook('close', async () => {
    try {
      await closeDatabase()
    } catch (error) {
      console.error('[mongodb] Failed to close during shutdown:', error)
    }
  })
})
