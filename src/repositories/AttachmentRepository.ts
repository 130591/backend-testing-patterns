import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { Attachment } from '../entities/Attachment'
import { AppDataSource } from '../config/data-source'

@Service()
export class AttachmentRepository {
  private repository: Repository<Attachment>

  constructor() {
    this.repository = AppDataSource.getRepository(Attachment)
  }

  async findById(id: number): Promise<Attachment | null> {
    return this.repository.findOneBy({ id })
  }

  async findByMedicalRecordId(medicalRecordId: number): Promise<Attachment[]> {
    return this.repository.find({ where: { medicalRecordId } })
  }

  async findByPatientId(patientId: number): Promise<Attachment[]> {
    return this.repository.find({ where: { patientId }, order: { createdAt: 'DESC' } })
  }

  async create(data: Partial<Attachment>): Promise<Attachment> {
    const attachment = this.repository.create(data)
    return this.repository.save(attachment)
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id)
  }
}
