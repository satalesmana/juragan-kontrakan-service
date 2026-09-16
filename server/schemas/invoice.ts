import { z } from 'zod'

export const invoiceItemSchema = z.object({
  type: z.enum(['rent', 'electricity', 'water', 'internet', 'penalty', 'other']),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().nonnegative('Price must be non-negative'),
  total: z.number().nonnegative('Total must be non-negative')
})

export const invoiceSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  roomId: z.string().min(1, 'Room ID is required'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
  contractId: z.string().min(1, 'Contract ID is required'),
  billingPeriod: z.string().regex(/^\d{4}-\d{2}$/, 'Billing period must be YYYY-MM'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice item is required'),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  penalty: z.number().nonnegative().default(0),
  total: z.number().nonnegative()
})

export const updateInvoiceSchema = invoiceSchema.partial()

export const generateInvoiceSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  billingPeriod: z.string().regex(/^\d{4}-\d{2}$/, 'Billing period must be YYYY-MM')
})

export type InvoiceInput = z.infer<typeof invoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>
