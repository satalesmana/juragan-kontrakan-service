import type { Db } from 'mongodb'
import { ObjectId } from 'mongodb'
import type { Property } from '../models/Property'
import { getDatabase } from '../plugins/mongodb'

export class PropertyRepository {
  private readonly collectionName = 'properties'

  private getCollection(db: Db) {
    return db.collection<Property>(this.collectionName)
  }

  async create(input: Omit<Property, '_id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
    const db = getDatabase()
    const now = new Date()
    const doc: Property = {
      ...input,
      _id: new ObjectId(),
      createdAt: now,
      updatedAt: now,
    }
    await this.getCollection(db).insertOne(doc)
    return doc
  }

  async findById(id: string): Promise<Property | null> {
    const db = getDatabase()
    return this.getCollection(db).findOne({ _id: new ObjectId(id) })
  }

  async findAll(limit: number, skip: number, search?: string): Promise<Property[]> {
    const db = getDatabase()
    const filter = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { address: { $regex: search, $options: 'i' } }] }
      : {}
    return this.getCollection(db)
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
  }

  async count(search?: string): Promise<number> {
    const db = getDatabase()
    const filter = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { address: { $regex: search, $options: 'i' } }] }
      : {}
    return this.getCollection(db).countDocuments(filter)
  }

  async update(id: string, update: Partial<Omit<Property, '_id' | 'createdAt'>>): Promise<Property | null> {
    const db = getDatabase()
    await this.getCollection(db).updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...update, updatedAt: new Date() } },
    )
    return this.findById(id)
  }

  async delete(id: string): Promise<boolean> {
    const db = getDatabase()
    const result = await this.getCollection(db).deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount === 1
  }
}
