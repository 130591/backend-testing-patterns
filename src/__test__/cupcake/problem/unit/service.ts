import { AppointmentStatus } from "../../../../enums"
import { AppointmentRepository } from "../../../../repositories/AppointmentRepository"
import { AuditLogRepository } from "../../../../repositories/AuditLogRepository"
import { DoctorRepository } from "../../../../repositories/DoctorRepository"
import { PatientRepository } from "../../../../repositories/PatientRepository"
import { AppointmentService } from "../../../../services/AppointmentService"
import { AuditLogService } from "../../../../services/AuditLogService"

jest.mock('../../../repositories/AppointmentRepository')
jest.mock('../../../repositories/DoctorRepository')
jest.mock('../../../repositories/PatientRepository')
jest.mock('../../../services/AuditLogService')

const makeSut = () => {
  const appointmentRepo = new AppointmentRepository() as jest.Mocked<AppointmentRepository>
  const doctorRepo = new DoctorRepository() as jest.Mocked<DoctorRepository>
  const patientRepo = new PatientRepository() as jest.Mocked<PatientRepository>
  const auditService = new AuditLogService(new AuditLogRepository()) as jest.Mocked<AuditLogService>
  const service = new AppointmentService(appointmentRepo, doctorRepo, patientRepo, auditService)

  return { appointmentRepo, doctorRepo, patientRepo, auditService, service }
}

describe('AppointmentService (cupcake)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Deve lancar 409 quando findConflicting retorna algo', async () => {
    const { service, appointmentRepo, patientRepo, doctorRepo } = makeSut()

    const dateTime = new Date()
    const endTime = new Date(dateTime.getTime() + 60 * 60 * 1000)

    patientRepo.findById.mockResolvedValue({ id: 1, name: 'John Doe', active: true } as any)
    doctorRepo.findById.mockResolvedValue({
      id: 1,
      name: 'Dr. Smith',
      active: true,
      consultationDuration: 30,
      availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    } as any)
    appointmentRepo.findConflicting.mockResolvedValue([
      { id: 1, doctorId: 1, patientId: 1, dateTime, endTime, status: AppointmentStatus.SCHEDULED } as any,
    ])

    const response = service.schedule({
      doctorId: 1,
      patientId: 1,
      dateTime,
      type: 'FIRST_VISIT',
      notes: 'Test appointment',
    })

    await expect(response).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringMatching(/already has/),
    })
  })
})