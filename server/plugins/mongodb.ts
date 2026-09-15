import { MongoClient, type Db } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

let client: MongoClient | null = null
let db: Db | null = null

export interface DbConfig {
  uri: string
  dbName: string
}

export async function connectDatabase(config?: Partial<DbConfig>): Promise<Db> {
  const uri = config?.uri || process.env.MONGODB_URI || 'mongodb://localhost:27017'
  const dbName = config?.dbName || process.env.MONGODB_DB_NAME || 'rental_management'

  if (client) {
    const currentDb = client.db(dbName)
    if (currentDb) {
      db = currentDb
      return currentDb
    }
  }

  client = new MongoClient(uri)
  await client.connect()
  db = client.db(dbName)
  console.log(`[mongodb] Connected to ${dbName}`)
  return db
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectDatabase() first.')
  }
  return db
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
    console.log('[mongodb] Connection closed')
  }
}

export default connectDatabase
