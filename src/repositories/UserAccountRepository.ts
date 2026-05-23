import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { UserAccount } from '../entities/UserAccount'
import { AppDataSource } from '../config/data-source'

@Service()
export class UserAccountRepository {
  private repository: Repository<UserAccount>

  constructor() {
    this.repository = AppDataSource.getRepository(UserAccount)
  }

  async findById(id: number): Promise<UserAccount | null> {
    return this.repository.findOneBy({ id })
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    return this.repository.findOneBy({ email })
  }

  async create(data: Partial<UserAccount>): Promise<UserAccount> {
    const account = this.repository.create(data)
    return this.repository.save(account)
  }

  async update(id: number, data: Partial<UserAccount>): Promise<UserAccount | null> {
    await this.repository.update(id, data)
    return this.findById(id)
  }
}
