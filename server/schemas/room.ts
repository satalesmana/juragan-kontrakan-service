import { z } from 'zod'

export const roomSchema = z.object({
  code: z.string().min(1, 'Room code is required'),
  name: z.string().optional(),
  floor: z.number().int().optional(),
  status: z.enum(['available', 'occupied', 'maintenance']).default('available'),
  facilities: z.array(z.string()).optional().default([])
})

export const updateRoomSchema = roomSchema.partial()

export type RoomInput = z.infer<typeof roomSchema>
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>
