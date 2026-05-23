import { Service } from 'typedi'
import { Request, Response } from 'express'
import { AuthService } from './AuthService'

@Service()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(req: Request, res: Response): Promise<void> {
    const account = await this.authService.register(req.body)
    res.status(201).json({
      id: account.id,
      email: account.email,
      role: account.role,
    })
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password, twoFactorToken } = req.body
    const result = await this.authService.login(email, password, twoFactorToken)
    res.json(result)
  }

  async enable2FA(req: Request, res: Response): Promise<void> {
    const result = await this.authService.enable2FA(req.user!.userId)
    res.json(result)
  }

  async confirm2FA(req: Request, res: Response): Promise<void> {
    await this.authService.confirm2FA(req.user!.userId, req.body.token)
    res.json({ message: '2FA enabled successfully' })
  }

  async me(req: Request, res: Response): Promise<void> {
    res.json(req.user)
  }
}
