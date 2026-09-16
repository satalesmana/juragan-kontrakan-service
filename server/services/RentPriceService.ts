import { RentPriceRepository, RentPriceDB } from '../repositories/RentPriceRepository'
import { RoomRepository } from '../repositories/RoomRepository'
import { PropertyRepository } from '../repositories/PropertyRepository'
import { RentPriceInput, UpdateRentPriceInput } from '../schemas/rentPrice'
import { ObjectId } from 'mongodb'

export class RentPriceService {
  private rentPriceRepo = new RentPriceRepository()
  private roomRepo = new RoomRepository()
  private propertyRepo = new PropertyRepository()

  async verifyRoomAccess(roomId: string, userId: string) {
    const room = await this.roomRepo.findById(roomId)
    if (!room) throw new Error('Room not found')
    const property = await this.propertyRepo.findById(room.propertyId.toString())
    if (!property) throw new Error('Property not found')
    if (property.createdBy.toString() !== userId) {
      throw new Error('Unauthorized property access')
    }
    return room
  }

  async createRentPrice(roomId: string, userId: string, input: RentPriceInput): Promise<RentPriceDB> {
    await this.verifyRoomAccess(roomId, userId)

    const effectiveFrom = new Date(input.effectiveFrom)
    const effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : undefined

    // Overlap check
    const existingPrices = await this.rentPriceRepo.findByRoomId(roomId)
    for (const p of existingPrices) {
      const pFrom = new Date(p.effectiveFrom)
      const pTo = p.effectiveTo ? new Date(p.effectiveTo) : new Date('9999-12-31')
      const newTo = effectiveTo || new Date('9999-12-31')

      if (effectiveFrom <= pTo && newTo >= pFrom) {
        throw new Error('Overlapping price periods')
      }
    }

    return this.rentPriceRepo.create({
      roomId: new ObjectId(roomId),
      price: input.price,
      effectiveFrom,
      effectiveTo
    })
  }

  async getRentPricesByRoom(roomId: string, userId: string): Promise<RentPriceDB[]> {
    await this.verifyRoomAccess(roomId, userId)
    return this.rentPriceRepo.findByRoomId(roomId)
  }

  async getRentPriceById(id: string, userId: string): Promise<RentPriceDB | null> {
    const rentPrice = await this.rentPriceRepo.findById(id)
    if (!rentPrice) return null
    await this.verifyRoomAccess(rentPrice.roomId.toString(), userId)
    return rentPrice
  }

  async updateRentPrice(id: string, userId: string, input: UpdateRentPriceInput): Promise<RentPriceDB | null> {
    const rentPrice = await this.getRentPriceById(id, userId)
    if (!rentPrice) return null

    const effectiveFrom = input.effectiveFrom ? new Date(input.effectiveFrom) : rentPrice.effectiveFrom
    const effectiveTo = input.effectiveTo !== undefined ? (input.effectiveTo ? new Date(input.effectiveTo) : undefined) : rentPrice.effectiveTo

    const existingPrices = await this.rentPriceRepo.findByRoomId(rentPrice.roomId.toString())
    for (const p of existingPrices) {
      if (p._id!.toString() === id) continue
      const pFrom = new Date(p.effectiveFrom)
      const pTo = p.effectiveTo ? new Date(p.effectiveTo) : new Date('9999-12-31')
      const newTo = effectiveTo || new Date('9999-12-31')

      if (effectiveFrom <= pTo && newTo >= pFrom) {
        throw new Error('Overlapping price periods')
      }
    }

    return this.rentPriceRepo.update(id, {
      price: input.price !== undefined ? input.price : rentPrice.price,
      effectiveFrom,
      effectiveTo
    })
  }

  async deleteRentPrice(id: string, userId: string): Promise<boolean> {
    await this.getRentPriceById(id, userId)
    return this.rentPriceRepo.delete(id)
  }

  async getRoomPriceAtDate(roomId: string, date: Date | string): Promise<number | null> {
    const targetDate = new Date(date)
    const prices = await this.rentPriceRepo.findByRoomId(roomId)
    
    for (const p of prices) {
      const from = new Date(p.effectiveFrom)
      const to = p.effectiveTo ? new Date(p.effectiveTo) : new Date('9999-12-31')
      if (targetDate >= from && targetDate <= to) {
        return p.price
      }
    }
    return null
  }
}
