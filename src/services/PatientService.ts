import { Service } from 'typedi'
import { Patient } from '../entities/Patient'
import { PatientRepository } from '../repositories/PatientRepository'
import { AuditLogService } from './AuditLogService'
import { AppError } from '../errors/AppError'

@Service()
export class PatientService {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(): Promise<Patient[]> {
    return this.patientRepository.findAll()
  }

  async findById(id: number): Promise<Patient | null> {
    return this.patientRepository.findById(id)
  }

  async findByCpf(cpf: string): Promise<Patient | null> {
    return this.patientRepository.findByCpf(cpf)
  }

  async searchByName(name: string): Promise<Patient[]> {
    return this.patientRepository.searchByName(name)
  }

  async create(data: Partial<Patient>): Promise<Patient> {
    if (data.cpf) {
      const existing = await this.patientRepository.findByCpf(data.cpf)
      if (existing) {
        throw new AppError('Patient with this CPF already exists', 409)
      }
    }

    const patient = await this.patientRepository.create(data)
    await this.auditLogService.log({
      action: 'CREATE',
      entity: 'Patient',
      entityId: patient.id,
      newValue: data as Record<string, unknown>,
    })
    return patient
  }

  async update(id: number, data: Partial<Patient>): Promise<Patient | null> {
    const existing = await this.patientRepository.findById(id)
    if (!existing) return null

    const patient = await this.patientRepository.update(id, data)
    await this.auditLogService.log({
      action: 'UPDATE',
      entity: 'Patient',
      entityId: id,
      oldValue: existing as unknown as Record<string, unknown>,
      newValue: data as Record<string, unknown>,
    })
    return patient
  }

  async delete(id: number): Promise<void> {
    await this.auditLogService.log({
      action: 'DELETE',
      entity: 'Patient',
      entityId: id,
    })
    await this.patientRepository.delete(id)
  }
}
