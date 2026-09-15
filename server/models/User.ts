import { ObjectId } from 'mongodb'

export interface User {
  _id: ObjectId
  name: string
  email: string
  passwordHash: string
  role: 'owner' | 'admin'
  propertyIds: ObjectId[]
  createdAt: Date
  updatedAt: Date
}
