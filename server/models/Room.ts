import { Schema, Document } from 'mongoose'

export interface IRoom extends Document {
  propertyId: Schema.Types.ObjectId
  code: string
  name?: string
  floor?: number
  status: 'available' | 'occupied' | 'maintenance'
  facilities?: string[]
  createdAt: Date
  updatedAt: Date
}

export const RoomSchema = new Schema<IRoom>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: false
  },
  floor: {
    type: Number,
    required: false
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available'
  },
  facilities: [{
    type: String,
    default: []
  }]
}, {
  timestamps: true,
  versionKey: false
})

// Unique index for propertyId + code
RoomSchema.index({ propertyId: 1, code: 1 }, { unique: true })
RoomSchema.index({ propertyId: 1, status: 1 })

export default RoomSchema