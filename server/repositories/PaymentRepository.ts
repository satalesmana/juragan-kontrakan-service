import { ObjectId } from 'mongodb'
import { getDatabase } from '../plugins/mongodb'

export interface PaymentDB {
  _id?: ObjectId
  invoiceId: ObjectId
  amount: number
  paymentDate: Date
  method: 'cash' | 'bank_transfer' | 'qris' | 'other'
  reference?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  createdBy: ObjectId
}

export class PaymentRepository {
  private readonly collectionName = 'payments'

  async getCollection() {
    const db = await getDatabase()
    return db.collection<PaymentDB>(this.collectionName)
  }

  async create(data: Omit<PaymentDB, '_id' | 'createdAt' | 'updatedAt'>): Promise<PaymentDB> {
    const col = await this.getCollection()
    const now = new Date()
    const doc: PaymentDB = {
      ...data,
      createdAt: now,
      updatedAt: now
    }
    const res = await col.insertOne(doc as any)
    doc._id = res.insertedId
    return doc
  }

  async findById(id: string): Promise<PaymentDB | null> {
    if (!ObjectId.isValid(id)) return null
    const col = await this.getCollection()
    return col.findOne({ _id: new ObjectId(id) })
  }

  async findByInvoiceId(invoiceId: string): Promise<PaymentDB[]> {
    if (!ObjectId.isValid(invoiceId)) return []
    const col = await this.getCollection()
    return col.find({ invoiceId: new ObjectId(invoiceId) }).sort({ paymentDate: 1 }).toArray()
  }

  async update(id: string, data: Partial<PaymentDB>): Promise<PaymentDB | null> {
    if (!ObjectId.isValid(id)) return null
    const col = await this.getCollection()
    const updateDoc = { ...data, updatedAt: new Date() }
    delete (updateDoc as any)._id
    delete (updateDoc as any).invoiceId
    delete (updateDoc as any).createdAt
    delete (updateDoc as any).createdBy

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
