import { z } from 'zod'

export const contractSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  roomId: z.string().min(1, 'Room ID is required'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  monthlyRent: z.number().positive('Monthly rent must be positive'),
  deposit: z.number().nonnegative().optional(),
  dueDay: z.number().int().min(1).max(31).default(10)
})

export const updateContractSchema = contractSchema.partial().omit({ propertyId: true, roomId: true, tenantId: true })

export type ContractInput = z.infer<typeof contractSchema>
export type UpdateContractInput = z.infer<typeof updateContractSchema>
