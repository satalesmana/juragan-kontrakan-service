import { ObjectId } from 'mongodb'
import { getDatabase } from '../plugins/mongodb'

export interface ContractDB {
  _id?: ObjectId
  propertyId: ObjectId
  roomId: ObjectId
  tenantId: ObjectId
  startDate: Date
  endDate?: Date
  monthlyRent: number
  deposit?: number
  dueDay: number
  status: 'active' | 'ended' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

export class ContractRepository {
  private readonly collectionName = 'contracts'

  async getCollection() {
    const db = await getDatabase()
    const col = db.collection<ContractDB>(this.collectionName)
    await col.createIndex({ roomId: 1, status: 1 })
    await col.createIndex({ propertyId: 1, status: 1 })
    return col
  }

  async create(data: Omit<ContractDB, '_id' | 'createdAt' | 'updatedAt'>, session?: any): Promise<ContractDB> {
    const col = await this.getCollection()
    const now = new Date()
    const doc: ContractDB = {
      ...data,
      createdAt: now,
      updatedAt: now
    }
    const options = session ? { session } : undefined
    const res = await col.insertOne(doc as any, options)
    doc._id = res.insertedId
    return doc
  }

  async findById(id: string): Promise<ContractDB | null> {
    if (!ObjectId.isValid(id)) return null
    const col = await this.getCollection()
    return col.findOne({ _id: new ObjectId(id) })
  }

  async findActiveByRoomId(roomId: string): Promise<ContractDB[]> {
    if (!ObjectId.isValid(roomId)) return []
    const col = await this.getCollection()
    return col.find({ roomId: new ObjectId(roomId), status: 'active' }).toArray()
  }

  async list(propertyIds: string[], page = 1, limit = 20, status?: string): Promise<{ contracts: ContractDB[], total: number }> {
    const col = await this.getCollection()
    const query: any = {
      propertyId: { $in: propertyIds.map(id => new ObjectId(id)) }
    }
    if (status) {
      query.status = status
    }
    const skip = (page - 1) * limit
    const [contracts, total] = await Promise.all([
      col.find(query).skip(skip).limit(limit).toArray(),
      col.countDocuments(query)
    ])
    return { contracts, total }
  }

  async update(id: string, data: Partial<ContractDB>, session?: any): Promise<ContractDB | null> {
    if (!ObjectId.isValid(id)) return null
    const col = await this.getCollection()
    const updateDoc = {
      ...data,
      updatedAt: new Date()
    }
    delete (updateDoc as any)._id
    delete (updateDoc as any).propertyId
    delete (updateDoc as any).roomId
    delete (updateDoc as any).tenantId
    delete (updateDoc as any).createdAt

    const options = session ? { session, returnDocument: 'after' } : { returnDocument: 'after' }
    const res = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      options as any
    )
    return 'value' in res ? res.value : res
  }
}
