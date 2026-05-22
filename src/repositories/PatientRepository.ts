import { Service } from 'typedi'
import { Repository, ILike } from 'typeorm'
import { Patient } from '../entities/Patient'
import { AppDataSource } from '../config/data-source'

@Service()
export class PatientRepository {
  private repository: Repository<Patient>

  constructor() {
    this.repository = AppDataSource.getRepository(Patient)
  }

  async findAll(): Promise<Patient[]> {
    return this.repository.find()
  }

  async findById(id: number): Promise<Patient | null> {
    return this.repository.findOneBy({ id })
  }

  async findByCpf(cpf: string): Promise<Patient | null> {
    return this.repository.findOneBy({ cpf })
  }

  async searchByName(name: string): Promise<Patient[]> {
    return this.repository.find({ where: { name: ILike(`%${name}%`) } })
  }

  async create(data: Partial<Patient>): Promise<Patient> {
    const patient = this.repository.create(data)
    return this.repository.save(patient)
  }

  async update(id: number, data: Partial<Patient>): Promise<Patient | null> {
    await this.repository.update(id, data)
    return this.findById(id)
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id)
  }
}
