import { Request, Response, NextFunction } from 'express'
import Container from 'typedi'
import { AuthService, JwtPayload } from './AuthService'
import { Role } from '../enums/Role'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    throw { statusCode: 401, message: 'Authorization header required' }
  }

  const token = header.split(' ')[1]
  const authService = Container.get(AuthService)
  req.user = authService.verifyToken(token)
  next()
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw { statusCode: 401, message: 'Not authenticated' }
    }
    if (!roles.includes(req.user.role)) {
      throw { statusCode: 403, message: 'Insufficient permissions' }
    }
    next()
  }
}
