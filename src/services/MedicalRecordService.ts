import { Service } from 'typedi'
import { MedicalRecord } from '../entities/MedicalRecord'
import { MedicalRecordRepository } from '../repositories/MedicalRecordRepository'
import { AppointmentRepository } from '../repositories/AppointmentRepository'
import { AuditLogService } from './AuditLogService'
import { AppError } from '../errors/AppError'

@Service()
export class MedicalRecordService {
  constructor(
    private readonly medicalRecordRepository: MedicalRecordRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(): Promise<MedicalRecord[]> {
    return this.medicalRecordRepository.findAll()
  }

  async findById(id: number): Promise<MedicalRecord | null> {
    return this.medicalRecordRepository.findById(id)
  }

  async findByPatientId(patientId: number): Promise<MedicalRecord[]> {
    return this.medicalRecordRepository.findByPatientId(patientId)
  }

  async create(data: Partial<MedicalRecord>, requestingDoctorId: number): Promise<MedicalRecord> {
    if (data.appointmentId) {
      const appointment = await this.appointmentRepository.findById(data.appointmentId)
      if (!appointment) {
        throw new AppError('Appointment not found', 404)
      }
    }

    data.doctorId = requestingDoctorId

    const record = await this.medicalRecordRepository.create(data)

    await this.auditLogService.log({
      action: 'CREATE',
      entity: 'MedicalRecord',
      entityId: record.id,
      userId: requestingDoctorId,
      newValue: data as unknown as Record<string, unknown>,
    })

    return record
  }

  async update(id: number, data: Partial<MedicalRecord>, requestingDoctorId: number): Promise<MedicalRecord | null> {
    const record = await this.medicalRecordRepository.findById(id)
    if (!record) {
      throw new AppError('Medical record not found', 404)
    }

    if (record.doctorId !== requestingDoctorId) {
      throw new AppError('Only the creating doctor can edit this record', 403)
    }

    const updated = await this.medicalRecordRepository.update(id, data)

    await this.auditLogService.log({
      action: 'UPDATE',
      entity: 'MedicalRecord',
      entityId: id,
      userId: requestingDoctorId,
      oldValue: record as unknown as Record<string, unknown>,
      newValue: data as unknown as Record<string, unknown>,
    })

    return updated
  }
}
