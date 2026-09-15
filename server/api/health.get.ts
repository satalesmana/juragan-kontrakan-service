import { defineHandler } from 'nitro'
import { getDatabase } from '../plugins/mongodb'

export default defineHandler(async () => {
  try {
    const db = getDatabase()
    await db.command({ ping: 1 })
    return {
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        service: 'juragan-kontrakan-api',
      },
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      data: {
        status: 'unhealthy',
        database: 'disconnected',
        error: msg,
      },
    }
  }
})
