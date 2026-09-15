import { ObjectId } from 'mongodb'

export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id)
}

export function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Error(`Invalid ObjectId: ${id}`)
  }
  return new ObjectId(id)
}

export function toStringId(id: ObjectId | string): string {
  return id instanceof ObjectId ? id.toHexString() : id
}

export function fromStringId(id: string): ObjectId {
  return new ObjectId(id)
}
