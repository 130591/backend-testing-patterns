import { Service } from 'typedi'
import { Request, Response } from 'express'
import { ExamRequestService } from '../services/ExamRequestService'
import { ExamRequestStatus } from '../enums'

@Service()
export class ExamRequestController {
  constructor(private readonly examRequestService: ExamRequestService) {}

  async findById(req: Request, res: Response): Promise<void> {
    const examRequest = await this.examRequestService.findById(Number(req.params.id))
    if (!examRequest) {
      res.status(404).json({ message: 'Exam request not found' })
      return
    }
    res.json(examRequest)
  }

  async findByPatientId(req: Request, res: Response): Promise<void> {
    const examRequests = await this.examRequestService.findByPatientId(Number(req.params.patientId))
    res.json(examRequests)
  }

  async create(req: Request, res: Response): Promise<void> {
    const examRequest = await this.examRequestService.create(req.body)
    res.status(201).json(examRequest)
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    const examRequest = await this.examRequestService.updateStatus(
      Number(req.params.id),
      req.body.status as ExamRequestStatus,
    )
    res.json(examRequest)
  }
}
