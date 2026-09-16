import { ObjectId } from 'mongodb'
import { getDatabase } from '../plugins/mongodb'

export interface RentPriceDB {
  _id?: ObjectId
  roomId: ObjectId
  price: number
  effectiveFrom: Date
  effectiveTo?: Date
  createdAt: Date
  updatedAt: Date
}

export class RentPriceRepository {
  private readonly collectionName = 'rent_prices'

  async getCollection() {
    const db = await getDatabase()
    const col = db.collection<RentPriceDB>(this.collectionName)
    await col.createIndex({ roomId: 1, effectiveFrom: 1 })
    return col
  }

  async create(data: Omit<RentPriceDB, '_id' | 'createdAt' | 'updatedAt'>): Promise<RentPriceDB> {
    const col = await this.getCollection()
    const now = new Date()
    const doc: RentPriceDB = {
      ...data,
      createdAt: now,
      updatedAt: now
    }
    const res = await col.insertOne(doc as any)
    doc._id = res.insertedId
    return doc
  }

  async findById(id: string): Promise<RentPriceDB | null> {
    if (!ObjectId.isValid(id)) return null
    const col = await this.getCollection()
    return col.findOne({ _id: new ObjectId(id) })
  }

  async findByRoomId(roomId: string): Promise<RentPriceDB[]> {
    if (!ObjectId.isValid(roomId)) return []
    const col = await this.getCollection()
    return col.find({ roomId: new ObjectId(roomId) }).sort({ effectiveFrom: 1 }).toArray()
  }

  async update(id: string, data: Partial<RentPriceDB>): Promise<RentPriceDB | null> {
    if (!ObjectId.isValid(id)) return null
    const col = await this.getCollection()
    const updateDoc = {
      ...data,
      updatedAt: new Date()
    }
    delete (updateDoc as any)._id
    delete (updateDoc as any).roomId
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
