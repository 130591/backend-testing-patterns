import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { MedicalRecord } from '../entities/MedicalRecord'
import { AppDataSource } from '../config/data-source'

@Service()
export class MedicalRecordRepository {
  private repository: Repository<MedicalRecord>

  constructor() {
    this.repository = AppDataSource.getRepository(MedicalRecord)
  }

  async findAll(): Promise<MedicalRecord[]> {
    return this.repository.find()
  }

  async findById(id: number): Promise<MedicalRecord | null> {
    return this.repository.findOneBy({ id })
  }

  async findByPatientId(patientId: number): Promise<MedicalRecord[]> {
    return this.repository.find({ where: { patientId }, order: { createdAt: 'DESC' } })
  }

  async findByAppointmentId(appointmentId: number): Promise<MedicalRecord | null> {
    return this.repository.findOneBy({ appointmentId })
  }

  async create(data: Partial<MedicalRecord>): Promise<MedicalRecord> {
    const record = this.repository.create(data)
    return this.repository.save(record)
  }

  async update(id: number, data: Partial<MedicalRecord>): Promise<MedicalRecord | null> {
    await this.repository.update(id, data)
    return this.findById(id)
  }
}
