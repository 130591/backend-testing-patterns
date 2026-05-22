import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { Doctor } from '../entities/Doctor'
import { AppDataSource } from '../config/data-source'

@Service()
export class DoctorRepository {
  private repository: Repository<Doctor>

  constructor() {
    this.repository = AppDataSource.getRepository(Doctor)
  }

  async findAll(): Promise<Doctor[]> {
    return this.repository.find()
  }

  async findById(id: number): Promise<Doctor | null> {
    return this.repository.findOneBy({ id })
  }

  async findByCrm(crm: string): Promise<Doctor | null> {
    return this.repository.findOneBy({ crm })
  }

  async findBySpecialty(specialty: string): Promise<Doctor[]> {
    return this.repository.find({ where: { specialty } })
  }

  async create(data: Partial<Doctor>): Promise<Doctor> {
    const doctor = this.repository.create(data)
    return this.repository.save(doctor)
  }

  async update(id: number, data: Partial<Doctor>): Promise<Doctor | null> {
    await this.repository.update(id, data)
    return this.findById(id)
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id)
  }
}
