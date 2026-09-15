import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserRepository } from '../repositories/UserRepository'
import type { RegisterInput, LoginInput } from '../schemas/auth'

const SALT_ROUNDS = 10

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface UserResponse {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin'
}

export class AuthService {
  private readonly repo = new UserRepository()

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  async register(input: RegisterInput): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    const existing = await this.repo.findByEmail(input.email)
    if (existing) {
      throw new Error('Email already registered')
    }

    const passwordHash = await this.hashPassword(input.password)
    const user = await this.repo.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'owner',
    })

    const tokens = await this.generateTokens(user)
    const response = this.toUserResponse(user)

    return { user: response, tokens }
  }

  async login(input: LoginInput): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    const user = await this.repo.findByEmail(input.email)
    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isValid = await this.verifyPassword(input.password, user.passwordHash)
    if (!isValid) {
      throw new Error('Invalid credentials')
    }

    const tokens = await this.generateTokens(user)
    const response = this.toUserResponse(user)

    return { user: response, tokens }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { id: string }
      const user = await this.repo.findById(payload.id)
      if (!user) {
        throw new Error('Invalid token')
      }
      return await this.generateTokens(user)
    } catch {
      throw new Error('Invalid refresh token')
    }
  }

  async getUserById(id: string): Promise<UserResponse | null> {
    const user = await this.repo.findById(id)
    if (!user) return null
    return this.toUserResponse(user)
  }

  private async generateTokens(user: any): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    )

    const refreshToken = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    )

    return { accessToken, refreshToken }
  }

  private toUserResponse(user: any): UserResponse {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }
  }
}
