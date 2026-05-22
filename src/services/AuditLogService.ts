import { Service } from 'typedi'
import { AuditLog } from '../entities/AuditLog'
import { AuditLogRepository } from '../repositories/AuditLogRepository'

@Service()
export class AuditLogService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async log(data: {
    userId?: number
    action: string
    entity: string
    entityId?: number
    oldValue?: Record<string, unknown>
    newValue?: Record<string, unknown>
    ipAddress?: string
  }): Promise<AuditLog> {
    return this.auditLogRepository.create({
      userId: data.userId ?? null,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId ?? null,
      oldValue: data.oldValue ?? null,
      newValue: data.newValue ?? null,
      ipAddress: data.ipAddress ?? null,
    })
  }

  async findByEntity(entity: string, entityId: number): Promise<AuditLog[]> {
    return this.auditLogRepository.findByEntity(entity, entityId)
  }
}
