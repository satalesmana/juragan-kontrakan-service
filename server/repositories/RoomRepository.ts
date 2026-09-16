import { ObjectId } from 'mongodb'
import { getDatabase } from '../plugins/mongodb'

export interface RoomDB {
  _id?: ObjectId
  propertyId: ObjectId
  code: string
  name?: string
  floor?: number
  status: 'available' | 'occupied' | 'maintenance'
  facilities?: string[]
  createdAt: Date
  updatedAt: Date
}

export class RoomRepository {
  private readonly collectionName = 'rooms'

  async getCollection() {
    const db = await getDatabase()
    const col = db.collection<RoomDB>(this.collectionName)
    // Ensure indexes
    await col.createIndex({ propertyId: 1, code: 1 }, { unique: true })
    await col.createIndex({ propertyId: 1, status: 1 })
    return col
  }

  async create(data: Omit<RoomDB, '_id' | 'createdAt' | 'updatedAt'>): Promise<RoomDB> {
    const col = await this.getCollection()
    const now = new Date()
    const doc: RoomDB = {
      ...data,
      createdAt: now,
      updatedAt: now
    }
    const res = await col.insertOne(doc as any)
    doc._id = res.insertedId
    return doc
  }

  async findById(id: string): Promise<RoomDB | null> {
    if (!ObjectId.isValid(id)) return null
    const col = await this.getCollection()
    return col.findOne({ _id: new ObjectId(id) })
  }

  async findByPropertyId(propertyId: string, page = 1, limit = 20): Promise<{ rooms: RoomDB[], total: number }> {
    if (!ObjectId.isValid(propertyId)) return { rooms: [], total: 0 }
    const col = await this.getCollection()
    const query = { propertyId: new ObjectId(propertyId) }
    const skip = (page - 1) * limit
    const [rooms, total] = await Promise.all([
      col.find(query).skip(skip).limit(limit).toArray(),
      col.countDocuments(query)
    ])
    return { rooms, total }
  }

  async update(id: string, data: Partial<RoomDB>): Promise<RoomDB | null> {
    if (!ObjectId.isValid(id)) return null
    const col = await this.getCollection()
    const updateDoc = {
      ...data,
      updatedAt: new Date()
    }
    delete (updateDoc as any)._id
    delete (updateDoc as any).propertyId
    delete (updateDoc as any).createdAt

    const res = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    )
    return res.value || res
  }

  async delete(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false
    const col = await this.getCollection()
    const res = await col.deleteOne({ _id: new ObjectId(id) })
    return res.deletedCount > 0
  }
}
