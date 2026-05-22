import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { Prescription } from '../entities/Prescription'
import { AppDataSource } from '../config/data-source'

@Service()
export class PrescriptionRepository {
  private repository: Repository<Prescription>

  constructor() {
    this.repository = AppDataSource.getRepository(Prescription)
  }

  async findAll(): Promise<Prescription[]> {
    return this.repository.find()
  }

  async findById(id: number): Promise<Prescription | null> {
    return this.repository.findOneBy({ id })
  }

  async findByPatientId(patientId: number): Promise<Prescription[]> {
    return this.repository.find({ where: { patientId }, order: { issuedAt: 'DESC' } })
  }

  async findByMedicalRecordId(medicalRecordId: number): Promise<Prescription[]> {
    return this.repository.find({ where: { medicalRecordId } })
  }

  async create(data: Partial<Prescription>): Promise<Prescription> {
    const prescription = this.repository.create(data)
    return this.repository.save(prescription)
  }
}
