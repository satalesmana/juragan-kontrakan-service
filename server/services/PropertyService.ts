import type { CreatePropertyInput, UpdatePropertyInput } from '../schemas/property'
import { PropertyRepository } from '../repositories/PropertyRepository'

export interface PropertyListResult {
  properties: Array<{
    _id: string
    name: string
    address?: string
    createdAt: string
  }>
  total: number
}

export class PropertyService {
  private readonly repo = new PropertyRepository()

  async list(page: number, limit: number, search?: string): Promise<PropertyListResult> {
    const skip = (page - 1) * limit
    const items = await this.repo.findAll(limit, skip, search)
    const total = await this.repo.count(search)
    return {
      properties: items.map((p) => ({
        _id: p._id.toString(),
        name: p.name,
        address: p.address,
        createdAt: p.createdAt.toISOString(),
      })),
      total,
    }
  }

  async create(input: CreatePropertyInput): Promise<{ _id: string; name: string; createdAt: string }> {
    const doc = await this.repo.create(input)
    return {
      _id: doc._id.toString(),
      name: doc.name,
      createdAt: doc.createdAt.toISOString(),
    }
  }

  async findById(id: string): Promise<{ _id: string; name: string; address?: string; createdAt: string } | null> {
    const doc = await this.repo.findById(id)
    if (!doc) return null
    return {
      _id: doc._id.toString(),
      name: doc.name,
      address: doc.address,
      createdAt: doc.createdAt.toISOString(),
    }
  }

  async update(id: string, input: UpdatePropertyInput): Promise<{ _id: string; name: string; address?: string } | null> {
    const doc = await this.repo.update(id, input)
    if (!doc) return null
    return { _id: doc._id.toString(), name: doc.name, address: doc.address }
  }

  async delete(id: string): Promise<boolean> {
    return this.repo.delete(id)
  }
}
