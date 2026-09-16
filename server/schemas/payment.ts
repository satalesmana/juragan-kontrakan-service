import { z } from 'zod'

export const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  method: z.enum(['cash', 'bank_transfer', 'qris', 'other']),
  reference: z.string().optional(),
  notes: z.string().optional()
})

export const updatePaymentSchema = paymentSchema.partial()

export type PaymentInput = z.infer<typeof paymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>
