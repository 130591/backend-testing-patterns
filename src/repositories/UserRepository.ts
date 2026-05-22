import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { User } from '../entities/User'
import { AppDataSource } from '../config/data-source'

@Service()
export class UserRepository {
  private repository: Repository<User>

  constructor() {
    this.repository = AppDataSource.getRepository(User)
  }

  async findAll(): Promise<User[]> {
    return this.repository.find()
  }

  async findById(id: number): Promise<User | null> {
    return this.repository.findOneBy({ id })
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repository.create(data)
    return this.repository.save(user)
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    await this.repository.update(id, data)
    return this.findById(id)
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id)
  }
}
