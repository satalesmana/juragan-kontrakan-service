import { ObjectId } from 'mongodb'
import { getDatabase } from '../plugins/mongodb'

export interface TenantDB {
  _id?: ObjectId
  name: string
  phone: string
  email?: string
  identityNumber?: string
  emergencyContact?: {
    name: string
    phone: string
  }
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export class TenantRepository {
  private readonly collectionName = 'tenants'

  async getCollection() {
    const db = await getDatabase()
    return db.collection<TenantDB>(this.collectionName)
  }

  async create(data: Omit<TenantDB, '_id' | 'createdAt' | 'updatedAt'>): Promise<TenantDB> {
    const col = await this.getCollection()
    const now = new Date()
    const doc: TenantDB = {
      ...data,
      createdAt: now,
      updatedAt: now
    }
    const res = await col.insertOne(doc as any)
    doc._id = res.insertedId
    return doc
  }

  async findById(id: string): Promise<TenantDB | null> {
    if (!ObjectId.isValid(id)) return null
    const col = await this.getCollection()
    return col.findOne({ _id: new ObjectId(id) })
  }

  async list(page = 1, limit = 20, search?: string): Promise<{ tenants: TenantDB[], total: number }> {
    const col = await this.getCollection()
    const query: any = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    const skip = (page - 1) * limit
    const [tenants, total] = await Promise.all([
      col.find(query).skip(skip).limit(limit).toArray(),
      col.countDocuments(query)
    ])
    return { tenants, total }
  }

  async update(id: string, data: Partial<TenantDB>): Promise<TenantDB | null> {
    if (!ObjectId.isValid(id)) return null
    const col = await this.getCollection()
    const updateDoc = {
      ...data,
      updatedAt: new Date()
    }
    delete (updateDoc as any)._id
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
