import { Service } from 'typedi'
import { ExamRequest } from '../entities/ExamRequest'
import { ExamRequestStatus } from '../enums'
import { ExamRequestRepository } from '../repositories/ExamRequestRepository'
import { MedicalRecordRepository } from '../repositories/MedicalRecordRepository'
import { AuditLogService } from './AuditLogService'
import { AppError } from '../errors/AppError'

const VALID_EXAM_TRANSITIONS: Record<ExamRequestStatus, ExamRequestStatus[]> = {
  [ExamRequestStatus.REQUESTED]: [ExamRequestStatus.SCHEDULED, ExamRequestStatus.CANCELLED],
  [ExamRequestStatus.SCHEDULED]: [ExamRequestStatus.COMPLETED, ExamRequestStatus.CANCELLED],
  [ExamRequestStatus.COMPLETED]: [],
  [ExamRequestStatus.CANCELLED]: [],
}

@Service()
export class ExamRequestService {
  constructor(
    private readonly examRequestRepository: ExamRequestRepository,
    private readonly medicalRecordRepository: MedicalRecordRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findById(id: number): Promise<ExamRequest | null> {
    return this.examRequestRepository.findById(id)
  }

  async findByPatientId(patientId: number): Promise<ExamRequest[]> {
    return this.examRequestRepository.findByPatientId(patientId)
  }

  async findByMedicalRecordId(medicalRecordId: number): Promise<ExamRequest[]> {
    return this.examRequestRepository.findByMedicalRecordId(medicalRecordId)
  }

  async create(data: Partial<ExamRequest>): Promise<ExamRequest> {
    if (!data.medicalRecordId) {
      throw new AppError('Medical record ID is required', 400)
    }

    const record = await this.medicalRecordRepository.findById(data.medicalRecordId)
    if (!record) {
      throw new AppError('Medical record not found', 404)
    }

    if (!data.exams || data.exams.length === 0) {
      throw new AppError('At least one exam is required', 400)
    }

    if (!data.requestedAt) {
      data.requestedAt = new Date()
    }

    data.status = ExamRequestStatus.REQUESTED

    const examRequest = await this.examRequestRepository.create(data)

    await this.auditLogService.log({
      action: 'CREATE',
      entity: 'ExamRequest',
      entityId: examRequest.id,
      newValue: data as unknown as Record<string, unknown>,
    })

    return examRequest
  }

  async updateStatus(id: number, status: ExamRequestStatus): Promise<ExamRequest> {
    const examRequest = await this.examRequestRepository.findById(id)
    if (!examRequest) {
      throw new AppError('Exam request not found', 404)
    }

    if (!VALID_EXAM_TRANSITIONS[examRequest.status].includes(status)) {
      throw new AppError(`Cannot transition from ${examRequest.status} to ${status}`, 400)
    }

    const updated = await this.examRequestRepository.update(id, { status })

    await this.auditLogService.log({
      action: 'UPDATE_STATUS',
      entity: 'ExamRequest',
      entityId: id,
      oldValue: { status: examRequest.status },
      newValue: { status },
    })

    return updated!
  }
}
