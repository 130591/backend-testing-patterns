import { Service } from 'typedi'
import { Prescription } from '../entities/Prescription'
import { PrescriptionRepository } from '../repositories/PrescriptionRepository'
import { MedicalRecordRepository } from '../repositories/MedicalRecordRepository'
import { AuditLogService } from './AuditLogService'
import { AppError } from '../errors/AppError'

@Service()
export class PrescriptionService {
  constructor(
    private readonly prescriptionRepository: PrescriptionRepository,
    private readonly medicalRecordRepository: MedicalRecordRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findById(id: number): Promise<Prescription | null> {
    return this.prescriptionRepository.findById(id)
  }

  async findByPatientId(patientId: number): Promise<Prescription[]> {
    return this.prescriptionRepository.findByPatientId(patientId)
  }

  async findByMedicalRecordId(medicalRecordId: number): Promise<Prescription[]> {
    return this.prescriptionRepository.findByMedicalRecordId(medicalRecordId)
  }

  async create(data: Partial<Prescription>): Promise<Prescription> {
    if (!data.medicalRecordId) {
      throw new AppError('Medical record ID is required', 400)
    }

    const record = await this.medicalRecordRepository.findById(data.medicalRecordId)
    if (!record) {
      throw new AppError('Medical record not found', 404)
    }

    if (!data.medications || data.medications.length === 0) {
      throw new AppError('At least one medication is required', 400)
    }

    for (const med of data.medications) {
      if (!med.name || !med.dosage || !med.frequency || !med.duration) {
        throw new AppError('Each medication must have name, dosage, frequency and duration', 400)
      }
    }

    if (!data.issuedAt) {
      data.issuedAt = new Date()
    }

    const prescription = await this.prescriptionRepository.create(data)

    await this.auditLogService.log({
      action: 'CREATE',
      entity: 'Prescription',
      entityId: prescription.id,
      newValue: data as unknown as Record<string, unknown>,
    })

    return prescription
  }
}
