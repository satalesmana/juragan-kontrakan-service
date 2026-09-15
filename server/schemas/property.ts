import { z } from 'zod'

export const propertySchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500).optional(),
})

export const updatePropertySchema = propertySchema.partial()

export type CreatePropertyInput = z.infer<typeof propertySchema>
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>
