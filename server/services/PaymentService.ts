import { ObjectId } from 'mongodb'
import { getDatabase } from '../plugins/mongodb'
import { PaymentRepository, PaymentDB } from '../repositories/PaymentRepository'
import { InvoiceRepository } from '../repositories/InvoiceRepository'
import type { PaymentInput, UpdatePaymentInput } from '../schemas/payment'

export class PaymentService {
  private paymentRepo = new PaymentRepository()
  private invoiceRepo = new InvoiceRepository()

  async calculateInvoiceStatus(invoiceId: string): Promise<{ paidAmount: number; outstanding: number; status: string }> {
    const invoice = await this.invoiceRepo.findById(invoiceId)
    if (!invoice) throw new Error('Invoice not found')

    const payments = await this.paymentRepo.findByInvoiceId(invoiceId)
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    const outstanding = invoice.total - paidAmount

    let status: string
    if (paidAmount === 0) {
      status = 'unpaid'
    } else if (paidAmount >= invoice.total) {
      status = 'paid'
    } else {
      status = 'partial'
    }

    // Check if overdue
    const now = new Date()
    if ((status === 'unpaid' || status === 'partial') && now > invoice.dueDate) {
      status = 'overdue'
    }

    return { paidAmount, outstanding, status }
  }

  async updateInvoiceStatus(invoiceId: string): Promise<void> {
    const { status } = await this.calculateInvoiceStatus(invoiceId)
    await this.invoiceRepo.update(invoiceId, { status })
  }

  async getPaymentsForInvoice(invoiceId: string): Promise<PaymentDB[]> {
    const invoice = await this.invoiceRepo.findById(invoiceId)
    if (!invoice) throw new Error('Invoice not found')
    return this.paymentRepo.findByInvoiceId(invoiceId)
  }

  async createPayment(invoiceId: string, userId: string, input: PaymentInput): Promise<{ payment: PaymentDB; paidAmount: number; outstanding: number; status: string }> {
    const invoice = await this.invoiceRepo.findById(invoiceId)
    if (!invoice) throw new Error('Invoice not found')
    if (invoice.status === 'cancelled') {
      throw new Error('Cannot pay cancelled invoice')
    }

    const payments = await this.paymentRepo.findByInvoiceId(invoiceId)
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    const outstanding = invoice.total - paidAmount

    if (input.amount > outstanding) {
      throw new Error('Payment exceeds outstanding amount')
    }

    const db = await getDatabase()
    const session = db.client.startSession()

    try {
      let payment: PaymentDB = {} as any
      await session.withTransaction(async () => {
        payment = await this.paymentRepo.create({
          invoiceId: new ObjectId(invoiceId),
          amount: input.amount,
          paymentDate: new Date(input.paymentDate),
          method: input.method,
          reference: input.reference,
          notes: input.notes,
          createdBy: new ObjectId(userId)
        }, session)

        // Recalculate and update invoice status
        const newPaidAmount = paidAmount + input.amount
        const newOutstanding = invoice.total - newPaidAmount
        let newStatus: string
        if (newPaidAmount === 0) {
          newStatus = 'unpaid'
        } else if (newPaidAmount >= invoice.total) {
          newStatus = 'paid'
        } else {
          newStatus = 'partial'
        }

        const now = new Date()
        if ((newStatus === 'unpaid' || newStatus === 'partial') && now > invoice.dueDate) {
          newStatus = 'overdue'
        }

        await this.invoiceRepo.update(invoiceId, { status: newStatus }, session)
      })
      await session.endSession()

      const finalPaidAmount = paidAmount + input.amount
      const finalOutstanding = invoice.total - finalPaidAmount

      return {
        payment,
        paidAmount: finalPaidAmount,
        outstanding: finalOutstanding,
        status: finalPaidAmount >= invoice.total ? 'paid' : finalPaidAmount > 0 ? 'partial' : 'unpaid'
      }
    } catch (error) {
      await session.endSession()
      throw error
    }
  }

  async getPaymentById(id: string, invoiceId: string): Promise<PaymentDB | null> {
    const payment = await this.paymentRepo.findById(id)
    if (!payment) return null
    if (payment.invoiceId.toString() !== invoiceId) {
      throw new Error('Unauthorized payment access')
    }
    return payment
  }

  async updatePayment(id: string, invoiceId: string, userId: string, input: UpdatePaymentInput): Promise<{ payment: PaymentDB; paidAmount: number; outstanding: number; status: string }> {
    const payment = await this.paymentRepo.findById(id)
    if (!payment) throw new Error('Payment not found')
    if (payment.invoiceId.toString() !== invoiceId) {
      throw new Error('Unauthorized payment access')
    }

    const invoice = await this.invoiceRepo.findById(invoiceId)
    if (!invoice) throw new Error('Invoice not found')
    if (invoice.status === 'cancelled') throw new Error('Cannot update payment for cancelled invoice')

    const db = await getDatabase()
    const session = db.client.startSession()

    try {
      let updatedPayment: PaymentDB = {} as any
      await session.withTransaction(async () => {
        // Remove old payment amount from calculation
        const otherPayments = await this.paymentRepo.findByInvoiceId(invoiceId)
          .then(ps => ps.filter(p => p._id!.toString() !== id))
        
        const currentPaidAmount = otherPayments.reduce((sum, p) => sum + p.amount, 0)
        const oldAmount = payment.amount
        const newAmount = input.amount ?? oldAmount
        
        // Validate new amount doesn't exceed outstanding
        const newOutstanding = invoice.total - currentPaidAmount - newAmount
        if (newOutstanding < 0) {
          throw new Error('Payment exceeds outstanding amount')
        }

        updatedPayment = await this.paymentRepo.update(id, {
          amount: newAmount,
          paymentDate: input.paymentDate ? new Date(input.paymentDate) : payment.paymentDate,
          method: input.method ?? payment.method,
          reference: input.reference ?? payment.reference,
          notes: input.notes ?? payment.notes
        }, session)

        // Recalculate invoice status
        const totalPaid = currentPaidAmount + newAmount
        let newStatus: string
        if (totalPaid === 0) {
          newStatus = 'unpaid'
        } else if (totalPaid >= invoice.total) {
          newStatus = 'paid'
        } else {
          newStatus = 'partial'
        }

        const now = new Date()
        if ((newStatus === 'unpaid' || newStatus === 'partial') && now > invoice.dueDate) {
          newStatus = 'overdue'
        }

        await this.invoiceRepo.update(invoiceId, { status: newStatus }, session)
      })
      await session.endSession()

      const otherPayments = await this.paymentRepo.findByInvoiceId(invoiceId)
        .then(ps => ps.filter(p => p._id!.toString() !== id))
      const totalPaid = otherPayments.reduce((sum, p) => sum + p.amount, 0) + updatedPayment.amount

      return {
        payment: updatedPayment,
        paidAmount: totalPaid,
        outstanding: invoice.total - totalPaid,
        status: totalPaid >= invoice.total ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid'
      }
    } catch (error) {
      await session.endSession()
      throw error
    }
  }

  async deletePayment(id: string, invoiceId: string, userId: string): Promise<boolean> {
    const payment = await this.paymentRepo.findById(id)
    if (!payment) return false
    if (payment.invoiceId.toString() !== invoiceId) {
      throw new Error('Unauthorized payment access')
    }

    const invoice = await this.invoiceRepo.findById(invoiceId)
    if (!invoice) throw new Error('Invoice not found')

    const db = await getDatabase()
    const session = db.client.startSession()

    try {
      await session.withTransaction(async () => {
        await this.paymentRepo.delete(id)
        
        // Recalculate invoice status after deletion
        const remainingPayments = await this.paymentRepo.findByInvoiceId(invoiceId)
        const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0)
        
        let newStatus: string
        if (totalPaid === 0) {
          newStatus = 'unpaid'
        } else if (totalPaid >= invoice.total) {
          newStatus = 'paid'
        } else {
          newStatus = 'partial'
        }

        const now = new Date()
        if ((newStatus === 'unpaid' || newStatus === 'partial') && now > invoice.dueDate) {
          newStatus = 'overdue'
        }

        await this.invoiceRepo.update(invoiceId, { status: newStatus }, session)
      })
      await session.endSession()
      return true
    } catch (error) {
      await session.endSession()
      throw error
    }
  }
}
