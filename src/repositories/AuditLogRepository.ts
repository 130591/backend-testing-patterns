import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { AuditLog } from '../entities/AuditLog'
import { AppDataSource } from '../config/data-source'

@Service()
export class AuditLogRepository {
  private repository: Repository<AuditLog>

  constructor() {
    this.repository = AppDataSource.getRepository(AuditLog)
  }

  async create(data: Partial<AuditLog>): Promise<AuditLog> {
    const log = this.repository.create(data)
    return this.repository.save(log)
  }

  async findByEntity(entity: string, entityId: number): Promise<AuditLog[]> {
    return this.repository.find({
      where: { entity, entityId },
      order: { createdAt: 'DESC' },
    })
  }
}
