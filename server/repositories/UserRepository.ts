import { ObjectId } from 'mongodb'
import { getDatabase } from '../plugins/mongodb'
import type { User } from '../models/User'

export class UserRepository {
  private readonly collectionName = 'users'

  private getCollection() {
    return getDatabase().collection<User>(this.collectionName)
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.getCollection().findOne({ email })
  }

  async findById(id: string): Promise<User | null> {
    return this.getCollection().findOne({ _id: new ObjectId(id) })
  }

  async create(input: Omit<User, '_id' | 'propertyIds' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const doc: User = {
      ...input,
      _id: new ObjectId(),
      propertyIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await this.getCollection().insertOne(doc)
    return doc
  }
}
