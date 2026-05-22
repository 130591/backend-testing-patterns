import { Service } from 'typedi'
import { Request, Response } from 'express'
import { MedicalRecordService } from '../services/MedicalRecordService'

@Service()
export class MedicalRecordController {
  constructor(private readonly medicalRecordService: MedicalRecordService) {}

  async findById(req: Request, res: Response): Promise<void> {
    const record = await this.medicalRecordService.findById(Number(req.params.id))
    if (!record) {
      res.status(404).json({ message: 'Medical record not found' })
      return
    }
    res.json(record)
  }

  async findByPatientId(req: Request, res: Response): Promise<void> {
    const records = await this.medicalRecordService.findByPatientId(Number(req.params.patientId))
    res.json(records)
  }

  async create(req: Request, res: Response): Promise<void> {
    // TODO: Extract doctorId from auth token when auth module is implemented
    const doctorId = req.body.doctorId
    const record = await this.medicalRecordService.create(req.body, doctorId)
    res.status(201).json(record)
  }

  async update(req: Request, res: Response): Promise<void> {
    // TODO: Extract doctorId from auth token when auth module is implemented
    const doctorId = req.body.doctorId
    const record = await this.medicalRecordService.update(Number(req.params.id), req.body, doctorId)
    if (!record) {
      res.status(404).json({ message: 'Medical record not found' })
      return
    }
    res.json(record)
  }
}
