import { ObjectId } from 'mongodb'
import { getDatabase } from '../plugins/mongodb'

export interface PropertyDB {
  _id?: ObjectId
  name: string
  address?: string
  settings: {
    defaultDueDay: number
    reminderDays: number[]
    currency: 'IDR'
  }
  createdAt: Date
  updatedAt: Date
  createdBy: ObjectId
  updatedBy: ObjectId
}

export class PropertyRepository {
  private readonly collectionName = 'properties'

  async getCollection() {
    const db = await getDatabase()
    return db.collection<PropertyDB>(this.collectionName)
  }

  async create(data: Omit<PropertyDB, '_id' | 'createdAt' | 'updatedAt'>): Promise<PropertyDB> {
    const col = await this.getCollection()
    const now = new Date()
    const doc: PropertyDB = {
      ...data,
      createdAt: now,
      updatedAt: now
    }
    const res = await col.insertOne(doc as any)
    doc._id = res.insertedId
    return doc
  }

  async findById(id: string): Promise<PropertyDB | null> {
    if (!ObjectId.isValid(id)) return null
    const col = await this.getCollection()
    return col.findOne({ _id: new ObjectId(id) })
  }

  async findByUserId(userId: string, page = 1, limit = 20, search?: string): Promise<{ properties: PropertyDB[], total: number }> {
    const col = await this.getCollection()
    const query: any = { createdBy: new ObjectId(userId) }
    if (search) {
      query.name = { $regex: search, $options: 'i' }
    }
    const skip = (page - 1) * limit
    const [properties, total] = await Promise.all([
      col.find(query).skip(skip).limit(limit).toArray(),
      col.countDocuments(query)
    ])
    return { properties, total }
  }

  async update(id: string, userId: string, data: Partial<PropertyDB>): Promise<PropertyDB | null> {
    if (!ObjectId.isValid(id)) return null
    const col = await this.getCollection()
    const updateDoc = {
      ...data,
      updatedAt: new Date(),
      updatedBy: new ObjectId(userId)
    }
    delete (updateDoc as any)._id
    delete (updateDoc as any).createdBy
    delete (updateDoc as any).createdAt

    const res = await col.findOneAndUpdate(
      { _id: new ObjectId(id), createdBy: new ObjectId(userId) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    )
    return res.value || res
  }

  async delete(id: string, userId: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false
    const col = await this.getCollection()
    const res = await col.deleteOne({ _id: new ObjectId(id), createdBy: new ObjectId(userId) })
    return res.deletedCount > 0
  }
}
