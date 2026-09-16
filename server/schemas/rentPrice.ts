import { z } from 'zod'

export const rentPriceSchema = z.object({
  price: z.number().positive('Price must be positive'),
  effectiveFrom: z.string().min(1, 'Effective from date is required'),
  effectiveTo: z.string().optional()
})

export const updateRentPriceSchema = rentPriceSchema.partial()

export type RentPriceInput = z.infer<typeof rentPriceSchema>
export type UpdateRentPriceInput = z.infer<typeof updateRentPriceSchema>
