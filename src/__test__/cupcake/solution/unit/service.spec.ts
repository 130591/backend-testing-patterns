import { AppointmentRepository } from "../../../../repositories/AppointmentRepository"
import { AuditLogRepository } from "../../../../repositories/AuditLogRepository"
import { DoctorRepository } from "../../../../repositories/DoctorRepository"
import { PatientRepository } from "../../../../repositories/PatientRepository"
import { AppointmentService } from "../../../../services/AppointmentService"
import { AuditLogService } from "../../../../services/AuditLogService"

jest.mock('../../../../repositories/AppointmentRepository')
jest.mock('../../../../repositories/DoctorRepository')
jest.mock('../../../../repositories/PatientRepository')
jest.mock('../../../../services/AuditLogService')

const sut = () => {
  const appointmentRepo = new AppointmentRepository() as jest.Mocked<AppointmentRepository>
  const doctorRepo = new DoctorRepository() as jest.Mocked<DoctorRepository>
  const patientRepo = new PatientRepository() as jest.Mocked<PatientRepository>
  const auditService = new AuditLogService(new AuditLogRepository()) as jest.Mocked<AuditLogService>

  return {
    appointmentRepo,
    doctorRepo,
    patientRepo,
    auditService,
    service: new AppointmentService(appointmentRepo, doctorRepo, patientRepo, auditService)
  }
}

describe('AppointmentService (solution)', () => {
  it('deve gerar conflito quando a uma sobreposicao de datas', () => {
    const { service, patientRepo, doctorRepo, appointmentRepo } = sut()
    patientRepo.findById.mockResolvedValue({ id: 1, name: 'John Doe', active: true } as any)
    doctorRepo.findById.mockResolvedValue({ id: 1, name: 'Dr. Smith', active: true, consultationDuration: 30, availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] } as any)

    appointmentRepo.findConflicting.mockResolvedValue([{ id: 1, doctorId: 1, dateTime: new Date(), endTime: new Date() }] as any)

    expect(service.schedule({
      doctorId: 1,
      patientId: 1,
      dateTime: new Date(),
      type: 'consultation'
    })).rejects.toThrow(expect.objectContaining({
      message: 'Doctor already has an appointment at this time',
      statusCode: 409
    }))
  })
})