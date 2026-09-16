import type { ContractDB } from '../repositories/ContractRepository'
import type { ContractInput } from '../schemas/contract'
import { ContractRepository } from '../repositories/ContractRepository'
import { PropertyRepository } from '../repositories/PropertyRepository'
import { RoomRepository } from '../repositories/RoomRepository'
import { TenantRepository } from '../repositories/TenantRepository'
import { ObjectId } from 'mongodb'
import { getDatabase } from '../plugins/mongodb'

export class ContractService {
  private contractRepo = new ContractRepository()
  private propertyRepo = new PropertyRepository()
  private roomRepo = new RoomRepository()
  private tenantRepo = new TenantRepository()

  async verifyPropertyAccess(propertyId: string, userId: string) {
    const property = await this.propertyRepo.findById(propertyId)
    if (!property) throw new Error('Property not found')
    if (property.createdBy.toString() !== userId) {
      throw new Error('Unauthorized property access')
    }
    return property
  }

  async createContract(userId: string, input: ContractInput): Promise<ContractDB> {
    await this.verifyPropertyAccess(input.propertyId, userId)

    const room = await this.roomRepo.findById(input.roomId)
    if (!room || room.propertyId.toString() !== input.propertyId) {
      throw new Error('Invalid room')
    }

    const tenant = await this.tenantRepo.findById(input.tenantId)
    if (!tenant) throw new Error('Tenant not found')

    // Check overlapping active contracts
    const activeContracts = await this.contractRepo.findActiveByRoomId(input.roomId)
    const newStart = new Date(input.startDate)
    const newEnd = input.endDate ? new Date(input.endDate) : new Date('9999-12-31')

    for (const c of activeContracts) {
      const cStart = new Date(c.startDate)
      const cEnd = c.endDate ? new Date(c.endDate) : new Date('9999-12-31')
      if (newStart <= cEnd && newEnd >= cStart) {
        throw new Error('Overlapping active contracts')
      }
    }

    
    const db = await getDatabase()
    const session = db.client.startSession()

    try {
      let contract: ContractDB = {} as any
      await session.withTransaction(async () => {
        contract = await this.contractRepo.create({
          propertyId: new ObjectId(input.propertyId),
          roomId: new ObjectId(input.roomId),
          tenantId: new ObjectId(input.tenantId),
          startDate: newStart,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          monthlyRent: input.monthlyRent,
          deposit: input.deposit,
          dueDay: input.dueDay,
          status: 'active'
        }, session)

        // Update room status to occupied
        const roomsCol = await this.roomRepo.getCollection()
        await roomsCol.updateOne(
          { _id: new ObjectId(input.roomId) },
          { $set: { status: 'occupied', updatedAt: new Date() } },
          { session }
        )
      })
      await session.endSession()
      return contract
    } catch (error) {
      await session.endSession()
      throw error
    }
  }

  async getContracts(userId: string, page = 1, limit = 20, status?: string) {
    const properties = await this.propertyRepo.findByUserId(userId, 1, 1000)
    const propertyIds = properties.properties.map(p => p._id!.toString())
    if (propertyIds.length === 0) return { contracts: [], total: 0 }
    return this.contractRepo.list(propertyIds, page, limit, status)
  }

  async getContractById(id: string, userId: string): Promise<ContractDB | null> {
    const contract = await this.contractRepo.findById(id)
    if (!contract) return null
    await this.verifyPropertyAccess(contract.propertyId.toString(), userId)
    return contract
  }

  async endContract(id: string, userId: string): Promise<ContractDB | null> {
    const contract = await this.getContractById(id, userId)
    if (!contract) return null

    const db = await getDatabase()
    const session = db.client.startSession()

    try {
      let updated: ContractDB | null = null
      await session.withTransaction(async () => {
        updated = await this.contractRepo.update(id, { status: 'ended' }, session)

        // Check if another active contract exists for this room
        const activeContracts = await this.contractRepo.findActiveByRoomId(contract.roomId.toString())
        const otherActive = activeContracts.some(c => c._id!.toString() !== id)

        if (!otherActive) {
          const roomsCol = await this.roomRepo.getCollection()
          await roomsCol.updateOne(
            { _id: contract.roomId },
            { $set: { status: 'available', updatedAt: new Date() } },
            { session }
          )
        }
      })
      await session.endSession()
      return updated
    } catch (error) {
      await session.endSession()
      throw error
    }
  }

  async cancelContract(id: string, userId: string): Promise<ContractDB | null> {
    const contract = await this.getContractById(id, userId)
    if (!contract) return null

    const db = await getDatabase()
    const session = db.client.startSession()

    try {
      let updated: ContractDB | null = null
      await session.withTransaction(async () => {
        updated = await this.contractRepo.update(id, { status: 'cancelled' }, session)

        const activeContracts = await this.contractRepo.findActiveByRoomId(contract.roomId.toString())
        const otherActive = activeContracts.some(c => c._id!.toString() !== id)

        if (!otherActive) {
          const roomsCol = await this.roomRepo.getCollection()
          await roomsCol.updateOne(
            { _id: contract.roomId },
            { $set: { status: 'available', updatedAt: new Date() } },
            { session }
          )
        }
      })
      await session.endSession()
      return updated
    } catch (error) {
      await session.endSession()
      throw error
    }
  }
}
