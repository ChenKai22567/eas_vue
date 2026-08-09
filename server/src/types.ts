import type { Request } from 'express'

export interface AuthUser {
  id: number
  username: string
  roleId: number
  tokenVersion: number
  permissions: string[]
}

export interface AuthRequest extends Request {
  auth?: AuthUser
}
