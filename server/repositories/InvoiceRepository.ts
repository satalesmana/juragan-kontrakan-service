import { ObjectId } from 'mongodb'
import { getDatabase } from '../plugins/mongodb'

export interface InvoiceItemDB {
  type: 'rent' | 'electricity' | 'water' | 'internet' | 'penalty' | 'other'
  description: string
  quantity: number
  price: number
  total: number
}

export interface InvoiceDB {
  _id?: ObjectId
  propertyId: ObjectId
  roomId: ObjectId
  tenantId: ObjectId
  contractId: ObjectId
  invoiceNumber: string
  billingPeriod: string
  issueDate: Date
  dueDate: Date
  items: InvoiceItemDB[]
  subtotal: number
  discount: number
  penalty: number
  total: number
  status: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  createdBy: ObjectId
}

export class InvoiceRepository {
  private readonly collectionName = 'invoices'

  async getCollection() {
    const db = await getDatabase()
    const col = db.collection<InvoiceDB>(this.collectionName)
    await col.createIndex({ contractId: 1, billingPeriod: 1 }, { unique: true })
    await col.createIndex({ propertyId: 1, tenantId: 1, billingPeriod: 1 })
    await col.createIndex({ status: 1 })
    return col
  }

  async create(data: Omit<InvoiceDB, '_id' | 'createdAt' | 'updatedAt'>): Promise<InvoiceDB> {
    const col = await this.getCollection()
    const now = new Date()
    const doc: InvoiceDB = {
      ...data,
      createdAt: now,
      updatedAt: now
    }
    const res = await col.insertOne(doc as any)
    doc._id = res.insertedId
    return doc
  }

  async findById(id: string): Promise<InvoiceDB | null> {
    if (!ObjectId.isValid(id)) return null
    const col = await this.getCollection()
    return col.findOne({ _id: new ObjectId(id) })
  }

  async findByContractAndPeriod(contractId: string, billingPeriod: string): Promise<InvoiceDB | null> {
    const col = await this.getCollection()
    return col.findOne({ contractId: new ObjectId(contractId), billingPeriod })
  }

  async list(filters: {
    propertyIds?: string[]
    tenantId?: string
    roomId?: string
    contractId?: string
    billingPeriod?: string
    status?: string
    dateFrom?: string
    dateTo?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{ invoices: InvoiceDB[]; total: number }> {
    const col = await this.getCollection()
    const query: any = {}

    if (filters.propertyIds && filters.propertyIds.length > 0) {
      query.propertyId = { $in: filters.propertyIds.map(id => new ObjectId(id)) }
    }
    if (filters.tenantId) query.tenantId = new ObjectId(filters.tenantId)
    if (filters.roomId) query.roomId = new ObjectId(filters.roomId)
    if (filters.contractId) query.contractId = new ObjectId(filters.contractId)
    if (filters.billingPeriod) query.billingPeriod = filters.billingPeriod
    if (filters.status) query.status = filters.status
    if (filters.search) {
      query.invoiceNumber = { $regex: filters.search, $options: 'i' }
    }
    if (filters.dateFrom || filters.dateTo) {
      query.issueDate = {}
      if (filters.dateFrom) query.issueDate.$gte = new Date(filters.dateFrom)
      if (filters.dateTo) query.issueDate.$lte = new Date(filters.dateTo)
    }

    const skip = ((filters.page ?? 1) - 1) * (filters.limit ?? 20)
    const [invoices, total] = await Promise.all([
      col.find(query).skip(skip).limit(filters.limit ?? 20).toArray(),
      col.countDocuments(query)
    ])
    return { invoices, total }
  }

  async update(id: string, data: Partial<InvoiceDB>): Promise<InvoiceDB | null> {
    if (!ObjectId.isValid(id)) return null
    const col = await this.getCollection()
    const updateDoc = { ...data, updatedAt: new Date() }
    delete (updateDoc as any)._id
    delete (updateDoc as any).propertyId
    delete (updateDoc as any).roomId
    delete (updateDoc as any).tenantId
    delete (updateDoc as any).contractId
    delete (updateDoc as any).createdAt
    delete (updateDoc as any).createdBy

    const res = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    )
    return res.value || res
  }
}
