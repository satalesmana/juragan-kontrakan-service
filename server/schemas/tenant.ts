import { z } from 'zod'

export const tenantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  identityNumber: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().min(1, 'Emergency contact name is required'),
    phone: z.string().min(1, 'Emergency contact phone is required')
  }).optional(),
  notes: z.string().optional()
})

export const updateTenantSchema = tenantSchema.partial()

export type TenantInput = z.infer<typeof tenantSchema>
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>
