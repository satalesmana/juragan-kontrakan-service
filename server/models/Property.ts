import { ObjectId } from 'mongodb'

export interface Property {
  _id: ObjectId
  name: string
  address?: string
  createdAt: Date
  updatedAt: Date
}
