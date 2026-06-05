import { AppointmentStatus } from "../../../../enums"
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

const makeSut = () => {
  const appointmentRepo = new AppointmentRepository() as jest.Mocked<AppointmentRepository>
  const doctorRepo = new DoctorRepository() as jest.Mocked<DoctorRepository>
  const patientRepo = new PatientRepository() as jest.Mocked<PatientRepository>
  const auditService = new AuditLogService(new AuditLogRepository()) as jest.Mocked<AuditLogService>
  const service = new AppointmentService(appointmentRepo, doctorRepo, patientRepo, auditService)

  return { appointmentRepo, doctorRepo, patientRepo, auditService, service }
}

describe('AppointmentRepository (cupcake)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Deve retornar conflito se a data do novo agendamento estiver sobreposta a do fim do agendamento anterior', async () => {
    const { appointmentRepo } = makeSut()

    const dateTime = new Date()
    const endTime = new Date(dateTime.getTime() + 60 * 60 * 1000)

    appointmentRepo.findConflicting.mockResolvedValueOnce([
      {
        id: 1,
        doctorId: 1,
        patientId: 1,
        dateTime,
        endTime,
        status: AppointmentStatus.SCHEDULED,
      },
    ] as any)

    const result = await appointmentRepo.findConflicting(1, dateTime, endTime)

    expect(result).toEqual([
      {
        id: 1,
        doctorId: 1,
        patientId: 1,
        dateTime,
        endTime,
        status: AppointmentStatus.SCHEDULED,
      },
    ])
  })
})