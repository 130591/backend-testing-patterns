import { Service } from 'typedi'
import { Request, Response } from 'express'
import { DoctorService } from '../services/DoctorService'

@Service()
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  async findAll(_req: Request, res: Response): Promise<void> {
    const doctors = await this.doctorService.findAll()
    res.json(doctors)
  }

  async findById(req: Request, res: Response): Promise<void> {
    const doctor = await this.doctorService.findById(Number(req.params.id))
    if (!doctor) {
      res.status(404).json({ message: 'Doctor not found' })
      return
    }
    res.json(doctor)
  }

  async create(req: Request, res: Response): Promise<void> {
    const doctor = await this.doctorService.create(req.body)
    res.status(201).json(doctor)
  }

  async update(req: Request, res: Response): Promise<void> {
    const doctor = await this.doctorService.update(Number(req.params.id), req.body)
    if (!doctor) {
      res.status(404).json({ message: 'Doctor not found' })
      return
    }
    res.json(doctor)
  }

  async delete(req: Request, res: Response): Promise<void> {
    await this.doctorService.delete(Number(req.params.id))
    res.status(204).send()
  }

  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    const dateStr = req.query.date as string
    if (!dateStr) {
      res.status(400).json({ message: 'Query parameter "date" is required (YYYY-MM-DD)' })
      return
    }
    const date = new Date(dateStr)
    const slots = await this.doctorService.getAvailableSlots(Number(req.params.id), date)
    res.json(slots)
  }
}
