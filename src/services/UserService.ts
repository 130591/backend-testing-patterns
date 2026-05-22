import { Service } from 'typedi'
import { User } from '../entities/User'
import { UserRepository } from '../repositories/UserRepository'

@Service()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll()
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findById(id)
  }

  async create(data: Partial<User>): Promise<User> {
    return this.userRepository.create(data)
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    return this.userRepository.update(id, data)
  }

  async delete(id: number): Promise<void> {
    return this.userRepository.delete(id)
  }
}
