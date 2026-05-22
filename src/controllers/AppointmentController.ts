import { Service } from 'typedi'
import { Request, Response } from 'express'
import { AppointmentService } from '../services/AppointmentService'

@Service()
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  async findAll(_req: Request, res: Response): Promise<void> {
    const appointments = await this.appointmentService.findAll()
    res.json(appointments)
  }

  async findById(req: Request, res: Response): Promise<void> {
    const appointment = await this.appointmentService.findById(Number(req.params.id))
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' })
      return
    }
    res.json(appointment)
  }

  async create(req: Request, res: Response): Promise<void> {
    const appointment = await this.appointmentService.schedule(req.body)
    res.status(201).json(appointment)
  }

  async cancel(req: Request, res: Response): Promise<void> {
    const result = await this.appointmentService.cancel(Number(req.params.id), req.body)
    res.json(result)
  }

  async confirm(req: Request, res: Response): Promise<void> {
    const appointment = await this.appointmentService.confirm(Number(req.params.id))
    res.json(appointment)
  }

  async startConsultation(req: Request, res: Response): Promise<void> {
    const appointment = await this.appointmentService.startConsultation(Number(req.params.id))
    res.json(appointment)
  }

  async complete(req: Request, res: Response): Promise<void> {
    const appointment = await this.appointmentService.complete(Number(req.params.id))
    res.json(appointment)
  }

  async markNoShow(req: Request, res: Response): Promise<void> {
    const appointment = await this.appointmentService.markNoShow(Number(req.params.id))
    res.json(appointment)
  }
}
