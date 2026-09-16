import { ObjectId } from 'mongodb'
import { getDatabase } from '../plugins/mongodb'
import { InvoiceRepository, InvoiceDB, InvoiceItemDB } from '../repositories/InvoiceRepository'
import { ContractRepository } from '../repositories/ContractRepository'
import { PropertyRepository } from '../repositories/PropertyRepository'
import { RoomRepository } from '../repositories/RoomRepository'
import { TenantRepository } from '../repositories/TenantRepository'
import type { GenerateInvoiceInput } from '../schemas/invoice'

export class InvoiceService {
  private invoiceRepo = new InvoiceRepository()
  private contractRepo = new ContractRepository()
  private propertyRepo = new PropertyRepository()
  private roomRepo = new RoomRepository()
  private tenantRepo = new TenantRepository()

  private generateInvoiceNumber(billingPeriod: string): string {
    const year = billingPeriod.split('-')[0]
    const month = billingPeriod.split('-')[1]
    // Simple sequential counter based on current count
    return `INV-${year}-${month}-${Math.floor(Math.random() * 9999) + 1}`.padStart(14, '0')
  }

  private getLastDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate()
  }

  async generateInvoices(userId: string, input: GenerateInvoiceInput) {
    // Verify property access
    await this.propertyRepo.findById(input.propertyId)
    const property = await this.propertyRepo.findById(input.propertyId)
    if (!property || property.createdBy.toString() !== userId) {
      throw new Error('Unauthorized property access')
    }

    const [year, month] = input.billingPeriod.split('-').map(Number)
    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 0, 23, 59, 59)
    const dueDay = 10 // Default due day, will be overridden by contract

    let generated = 0
    let skipped = 0
    const errors: string[] = []

    // Find all active contracts for this property during the billing period
    const properties = [input.propertyId]
    const contracts = await this.contractRepo.list(properties, 1, 1000)

    for (const contract of contracts.contracts) {
      if (contract.status !== 'active') continue

      const contractStart = new Date(contract.startDate)
      const contractEnd = contract.endDate ? new Date(contract.endDate) : new Date('9999-12-31')

      // Check if contract is active during billing period
      if (contractStart > periodEnd || contractEnd < periodStart) continue

      // Check for existing invoice
      const existing = await this.invoiceRepo.findByContractAndPeriod(contract._id!.toString(), input.billingPeriod)
      if (existing) {
        skipped++
        continue
      }

      try {
        // Calculate due date based on contract's dueDay
        const contractDueDay = contract.dueDay || 10
        const effectiveDueDay = Math.min(contractDueDay, this.getLastDayOfMonth(year, month))
        const dueDate = new Date(year, month - 1, effectiveDueDay)

        // Create invoice item (snapshot of rent price)
        const rentItem: InvoiceItemDB = {
          type: 'rent',
          description: `Sewa kamar ${contract.roomId.toString().slice(-4)}`,
          quantity: 1,
          price: contract.monthlyRent,
          total: contract.monthlyRent
        }

        // Generate invoice number with proper format
        const invoiceNumber = this.generateInvoiceNumber(input.billingPeriod)

        const invoice = await this.invoiceRepo.create({
          propertyId: new ObjectId(contract.propertyId),
          roomId: new ObjectId(contract.roomId),
          tenantId: new ObjectId(contract.tenantId),
          contractId: new ObjectId(contract._id),
          invoiceNumber,
          billingPeriod: input.billingPeriod,
          issueDate: new Date(),
          dueDate,
          items: [rentItem],
          subtotal: contract.monthlyRent,
          discount: 0,
          penalty: 0,
          total: contract.monthlyRent,
          status: 'unpaid',
          createdBy: new ObjectId(userId)
        })

        generated++
      } catch (error: any) {
        if (error.code === 11000) {
          skipped++
        } else {
          errors.push(`Failed for contract ${contract._id}: ${error.message}`)
        }
      }
    }

    return { generated, skipped, errors }
  }

  async createInvoice(userId: string, invoiceData: any): Promise<InvoiceDB> {
    await this.propertyRepo.findById(invoiceData.propertyId)
    const property = await this.propertyRepo.findById(invoiceData.propertyId)
    if (!property || property.createdBy.toString() !== userId) {
      throw new Error('Unauthorized property access')
    }
    return this.invoiceRepo.create(invoiceData)
  }

  async getInvoices(userId: string, filters: any) {
    const properties = await this.propertyRepo.findByUserId(userId, 1, 1000)
    const propertyIds = properties.properties.map(p => p._id!.toString())
    return this.invoiceRepo.list({ ...filters, propertyIds })
  }

  async getInvoiceById(id: string, userId: string): Promise<InvoiceDB | null> {
    const invoice = await this.invoiceRepo.findById(id)
    if (!invoice) return null
    await this.propertyRepo.findById(invoice.propertyId.toString())
    const property = await this.propertyRepo.findById(invoice.propertyId.toString())
    if (!property || property.createdBy.toString() !== userId) {
      throw new Error('Unauthorized property access')
    }
    return invoice
  }

  async updateInvoice(id: string, userId: string, data: Partial<InvoiceDB>): Promise<InvoiceDB | null> {
    await this.getInvoiceById(id, userId)
    return this.invoiceRepo.update(id, data)
  }

  async cancelInvoice(id: string, userId: string): Promise<InvoiceDB | null> {
    const invoice = await this.getInvoiceById(id, userId)
    if (!invoice) return null
    if (invoice.status === 'cancelled') return invoice
    return this.invoiceRepo.update(id, { status: 'cancelled' })
  }
}
