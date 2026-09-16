import { z } from 'zod'

export const propertySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  settings: z.object({
    defaultDueDay: z.number().int().min(1).max(31).default(10),
    reminderDays: z.array(z.number().int()).default([3, 7]),
    currency: z.literal('IDR').default('IDR')
  }).default({
    defaultDueDay: 10,
    reminderDays: [3, 7],
    currency: 'IDR'
  })
})

export const updatePropertySchema = propertySchema.partial()

export type PropertyInput = z.infer<typeof propertySchema>
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>
