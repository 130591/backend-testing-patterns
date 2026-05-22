import { Service } from 'typedi'
import { Request, Response } from 'express'
import { UserService } from '../services/UserService'

@Service()
export class UserController {
  constructor(private readonly userService: UserService) {}

  async findAll(_req: Request, res: Response): Promise<void> {
    const users = await this.userService.findAll()
    res.json(users)
  }

  async findById(req: Request, res: Response): Promise<void> {
    const user = await this.userService.findById(Number(req.params.id))
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    res.json(user)
  }

  async create(req: Request, res: Response): Promise<void> {
    const user = await this.userService.create(req.body)
    res.status(201).json(user)
  }

  async update(req: Request, res: Response): Promise<void> {
    const user = await this.userService.update(Number(req.params.id), req.body)
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    res.json(user)
  }

  async delete(req: Request, res: Response): Promise<void> {
    await this.userService.delete(Number(req.params.id))
    res.status(204).send()
  }
}
