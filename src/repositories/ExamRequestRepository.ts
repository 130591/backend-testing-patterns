import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { ExamRequest } from '../entities/ExamRequest'
import { ExamRequestStatus } from '../enums'
import { AppDataSource } from '../config/data-source'

@Service()
export class ExamRequestRepository {
  private repository: Repository<ExamRequest>

  constructor() {
    this.repository = AppDataSource.getRepository(ExamRequest)
  }

  async findAll(): Promise<ExamRequest[]> {
    return this.repository.find()
  }

  async findById(id: number): Promise<ExamRequest | null> {
    return this.repository.findOneBy({ id })
  }

  async findByPatientId(patientId: number): Promise<ExamRequest[]> {
    return this.repository.find({ where: { patientId }, order: { requestedAt: 'DESC' } })
  }

  async findByMedicalRecordId(medicalRecordId: number): Promise<ExamRequest[]> {
    return this.repository.find({ where: { medicalRecordId } })
  }

  async findByStatus(status: ExamRequestStatus): Promise<ExamRequest[]> {
    return this.repository.find({ where: { status } })
  }

  async create(data: Partial<ExamRequest>): Promise<ExamRequest> {
    const examRequest = this.repository.create(data)
    return this.repository.save(examRequest)
  }

  async update(id: number, data: Partial<ExamRequest>): Promise<ExamRequest | null> {
    await this.repository.update(id, data)
    return this.findById(id)
  }
}
