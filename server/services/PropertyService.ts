import { PropertyRepository, PropertyDB } from '../repositories/PropertyRepository'
import { PropertyInput, UpdatePropertyInput } from '../schemas/property'

export class PropertyService {
  private propertyRepo = new PropertyRepository()

  async createProperty(userId: string, input: PropertyInput): Promise<PropertyDB> {
    return this.propertyRepo.create({
      ...input,
      createdBy: new (await import('mongodb')).ObjectId(userId),
      updatedBy: new (await import('mongodb')).ObjectId(userId)
    })
  }

  async getProperties(userId: string, page = 1, limit = 20, search?: string) {
    return this.propertyRepo.findByUserId(userId, page, limit, search)
  }

  async getPropertyById(id: string, userId: string): Promise<PropertyDB | null> {
    const property = await this.propertyRepo.findById(id)
    if (!property) return null
    if (property.createdBy.toString() !== userId) {
      throw new Error('Unauthorized property access')
    }
    return property
  }

  async updateProperty(id: string, userId: string, input: UpdatePropertyInput): Promise<PropertyDB | null> {
    await this.getPropertyById(id, userId) // check ownership
    return this.propertyRepo.update(id, userId, input)
  }

  async deleteProperty(id: string, userId: string): Promise<boolean> {
    await this.getPropertyById(id, userId) // check ownership
    return this.propertyRepo.delete(id, userId)
  }
}
