import { Service } from 'typedi'
import { PatientInsurance } from '../entities/PatientInsurance'
import { PatientInsuranceRepository } from '../repositories/PatientInsuranceRepository'
import { PatientRepository } from '../repositories/PatientRepository'
import { InsurancePlanRepository } from '../repositories/InsurancePlanRepository'
import { AuditLogService } from './AuditLogService'
import { AppError } from '../errors/AppError'

@Service()
export class PatientInsuranceService {
  constructor(
    private readonly patientInsuranceRepository: PatientInsuranceRepository,
    private readonly patientRepository: PatientRepository,
    private readonly insurancePlanRepository: InsurancePlanRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findByPatientId(patientId: number): Promise<PatientInsurance[]> {
    return this.patientInsuranceRepository.findByPatientId(patientId)
  }

  async create(data: Partial<PatientInsurance>): Promise<PatientInsurance> {
    if (!data.patientId) {
      throw new AppError('Patient ID is required', 400)
    }

    const patient = await this.patientRepository.findById(data.patientId)
    if (!patient) {
      throw new AppError('Patient not found', 404)
    }

    if (!data.insurancePlanId) {
      throw new AppError('Insurance plan ID is required', 400)
    }

    const plan = await this.insurancePlanRepository.findById(data.insurancePlanId)
    if (!plan || !plan.active) {
      throw new AppError('Insurance plan not found or inactive', 404)
    }

    const insurance = await this.patientInsuranceRepository.create(data)

    await this.auditLogService.log({
      action: 'CREATE',
      entity: 'PatientInsurance',
      entityId: insurance.id,
      newValue: data as unknown as Record<string, unknown>,
    })

    return insurance
  }

  async delete(id: number): Promise<void> {
    await this.auditLogService.log({
      action: 'DELETE',
      entity: 'PatientInsurance',
      entityId: id,
    })
    await this.patientInsuranceRepository.delete(id)
  }
}
