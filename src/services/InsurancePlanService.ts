import { Service } from 'typedi'
import { InsurancePlan } from '../entities/InsurancePlan'
import { InsurancePlanRepository } from '../repositories/InsurancePlanRepository'

@Service()
export class InsurancePlanService {
  constructor(private readonly insurancePlanRepository: InsurancePlanRepository) {}

  async findAll(): Promise<InsurancePlan[]> {
    return this.insurancePlanRepository.findAll()
  }

  async findById(id: number): Promise<InsurancePlan | null> {
    return this.insurancePlanRepository.findById(id)
  }

  async create(data: Partial<InsurancePlan>): Promise<InsurancePlan> {
    return this.insurancePlanRepository.create(data)
  }

  async update(id: number, data: Partial<InsurancePlan>): Promise<InsurancePlan | null> {
    return this.insurancePlanRepository.update(id, data)
  }

  async delete(id: number): Promise<void> {
    return this.insurancePlanRepository.delete(id)
  }
}
