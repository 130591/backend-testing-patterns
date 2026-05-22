import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { PatientInsurance } from '../entities/PatientInsurance'
import { AppDataSource } from '../config/data-source'

@Service()
export class PatientInsuranceRepository {
  private repository: Repository<PatientInsurance>

  constructor() {
    this.repository = AppDataSource.getRepository(PatientInsurance)
  }

  async findAll(): Promise<PatientInsurance[]> {
    return this.repository.find()
  }

  async findById(id: number): Promise<PatientInsurance | null> {
    return this.repository.findOneBy({ id })
  }

  async findByPatientId(patientId: number): Promise<PatientInsurance[]> {
    return this.repository.find({
      where: { patientId },
      relations: ['insurancePlan'],
    })
  }

  async create(data: Partial<PatientInsurance>): Promise<PatientInsurance> {
    const insurance = this.repository.create(data)
    return this.repository.save(insurance)
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id)
  }
}
