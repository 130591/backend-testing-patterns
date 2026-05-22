import { Service } from 'typedi'
import { Request, Response } from 'express'
import { PrescriptionService } from '../services/PrescriptionService'

@Service()
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  async findById(req: Request, res: Response): Promise<void> {
    const prescription = await this.prescriptionService.findById(Number(req.params.id))
    if (!prescription) {
      res.status(404).json({ message: 'Prescription not found' })
      return
    }
    res.json(prescription)
  }

  async findByPatientId(req: Request, res: Response): Promise<void> {
    const prescriptions = await this.prescriptionService.findByPatientId(Number(req.params.patientId))
    res.json(prescriptions)
  }

  async create(req: Request, res: Response): Promise<void> {
    const prescription = await this.prescriptionService.create(req.body)
    res.status(201).json(prescription)
  }
}
