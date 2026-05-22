import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { InsurancePlan } from '../entities/InsurancePlan'
import { AppDataSource } from '../config/data-source'

@Service()
export class InsurancePlanRepository {
  private repository: Repository<InsurancePlan>

  constructor() {
    this.repository = AppDataSource.getRepository(InsurancePlan)
  }

  async findAll(): Promise<InsurancePlan[]> {
    return this.repository.find()
  }

  async findById(id: number): Promise<InsurancePlan | null> {
    return this.repository.findOneBy({ id })
  }

  async create(data: Partial<InsurancePlan>): Promise<InsurancePlan> {
    const plan = this.repository.create(data)
    return this.repository.save(plan)
  }

  async update(id: number, data: Partial<InsurancePlan>): Promise<InsurancePlan | null> {
    await this.repository.update(id, data)
    return this.findById(id)
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id)
  }
}
