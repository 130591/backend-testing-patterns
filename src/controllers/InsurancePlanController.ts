import { Service } from 'typedi'
import { Request, Response } from 'express'
import { InsurancePlanService } from '../services/InsurancePlanService'

@Service()
export class InsurancePlanController {
  constructor(private readonly insurancePlanService: InsurancePlanService) {}

  async findAll(_req: Request, res: Response): Promise<void> {
    const plans = await this.insurancePlanService.findAll()
    res.json(plans)
  }

  async findById(req: Request, res: Response): Promise<void> {
    const plan = await this.insurancePlanService.findById(Number(req.params.id))
    if (!plan) {
      res.status(404).json({ message: 'Insurance plan not found' })
      return
    }
    res.json(plan)
  }

  async create(req: Request, res: Response): Promise<void> {
    const plan = await this.insurancePlanService.create(req.body)
    res.status(201).json(plan)
  }

  async update(req: Request, res: Response): Promise<void> {
    const plan = await this.insurancePlanService.update(Number(req.params.id), req.body)
    if (!plan) {
      res.status(404).json({ message: 'Insurance plan not found' })
      return
    }
    res.json(plan)
  }

  async delete(req: Request, res: Response): Promise<void> {
    await this.insurancePlanService.delete(Number(req.params.id))
    res.status(204).send()
  }
}
