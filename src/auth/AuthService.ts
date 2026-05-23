import { Service } from 'typedi'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import * as speakeasy from 'speakeasy'
import * as QRCode from 'qrcode'
import { UserAccount } from '../entities/UserAccount'
import { UserAccountRepository } from '../repositories/UserAccountRepository'
import { Role } from '../enums/Role'
import { AppError } from '../errors/AppError'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'

export interface JwtPayload {
  userId: number
  email: string
  role: Role
  referenceId: number | null
}

@Service()
export class AuthService {
  constructor(private readonly userAccountRepository: UserAccountRepository) {}

  async register(data: {
    email: string
    password: string
    role: Role
    referenceId?: number
  }): Promise<UserAccount> {
    const existing = await this.userAccountRepository.findByEmail(data.email)
    if (existing) {
      throw new AppError('Email already registered', 409)
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    return this.userAccountRepository.create({
      email: data.email,
      password: hashedPassword,
      role: data.role,
      referenceId: data.referenceId ?? null,
    })
  }

  async login(email: string, password: string, twoFactorToken?: string): Promise<{ token: string }> {
    const account = await this.userAccountRepository.findByEmail(email)
    if (!account || !account.active) {
      throw new AppError('Invalid credentials', 401)
    }

    const passwordValid = await bcrypt.compare(password, account.password)
    if (!passwordValid) {
      throw new AppError('Invalid credentials', 401)
    }

    if (account.twoFactorEnabled) {
      if (!twoFactorToken) {
        throw new AppError('Two-factor authentication token required', 403)
      }
      const verified = speakeasy.totp.verify({
        secret: account.twoFactorSecret!,
        encoding: 'base32',
        token: twoFactorToken,
      })
      if (!verified) {
        throw new AppError('Invalid two-factor token', 403)
      }
    }

    const payload: JwtPayload = {
      userId: account.id,
      email: account.email,
      role: account.role,
      referenceId: account.referenceId,
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] })
    return { token }
  }

  async enable2FA(userId: number): Promise<{ qrCodeUrl: string }> {
    const account = await this.userAccountRepository.findById(userId)
    if (!account) {
      throw new AppError('Account not found', 404)
    }

    const secret = speakeasy.generateSecret({
      name: `MedicalApp:${account.email}`,
    })

    await this.userAccountRepository.update(userId, {
      twoFactorSecret: secret.base32,
    })

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)
    return { qrCodeUrl }
  }

  async confirm2FA(userId: number, token: string): Promise<void> {
    const account = await this.userAccountRepository.findById(userId)
    if (!account || !account.twoFactorSecret) {
      throw new AppError('2FA not initiated', 400)
    }

    const verified = speakeasy.totp.verify({
      secret: account.twoFactorSecret,
      encoding: 'base32',
      token,
    })

    if (!verified) {
      throw new AppError('Invalid token', 400)
    }

    await this.userAccountRepository.update(userId, {
      twoFactorEnabled: true,
    })
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload
    } catch {
      throw new AppError('Invalid or expired token', 401)
    }
  }
}
