import { RoomRepository, RoomDB } from '../repositories/RoomRepository'
import { PropertyRepository } from '../repositories/PropertyRepository'
import { RoomInput, UpdateRoomInput } from '../schemas/room'

export class RoomService {
  private roomRepo = new RoomRepository()
  private propertyRepo = new PropertyRepository()

  async verifyOwnership(propertyId: string, userId: string) {
    const property = await this.propertyRepo.findById(propertyId)
    if (!property) {
      throw new Error('Property not found')
    }
    if (property.createdBy.toString() !== userId) {
      throw new Error('Unauthorized property access')
    }
    return property
  }

  async createRoom(propertyId: string, userId: string, input: RoomInput): Promise<RoomDB> {
    await this.verifyOwnership(propertyId, userId)
    try {
      return await this.roomRepo.create({
        ...input,
        propertyId: new (await import('mongodb')).ObjectId(propertyId)
      })
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('Room code already exists in this property')
      }
      throw error
    }
  }

  async getRoomsByProperty(propertyId: string, userId: string, page = 1, limit = 20) {
    await this.verifyOwnership(propertyId, userId)
    return this.roomRepo.findByPropertyId(propertyId, page, limit)
  }

  async getRoomById(roomId: string, userId: string): Promise<RoomDB | null> {
    const room = await this.roomRepo.findById(roomId)
    if (!room) return null
    await this.verifyOwnership(room.propertyId.toString(), userId)
    return room
  }

  async updateRoom(roomId: string, userId: string, input: UpdateRoomInput): Promise<RoomDB | null> {
    const room = await this.roomRepo.findById(roomId)
    if (!room) return null
    await this.verifyOwnership(room.propertyId.toString(), userId)
    try {
      return await this.roomRepo.update(roomId, input)
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('Room code already exists in this property')
      }
      throw error
    }
  }

  async deleteRoom(roomId: string, userId: string): Promise<boolean> {
    const room = await this.roomRepo.findById(roomId)
    if (!room) return false
    await this.verifyOwnership(room.propertyId.toString(), userId)
    return this.roomRepo.delete(roomId)
  }
}
