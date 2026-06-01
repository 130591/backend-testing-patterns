import { AppointmentStatus } from '../../../../enums'
import { AppointmentService } from '../../../../services/AppointmentService'

const HOUR = 60 * 60 * 1000

export function setup(appointmentOverrides: Partial<{ id: number; status: AppointmentStatus; dateTime: Date }> = {}) {
  const appointment = {
    id: 42,
    patientId: 1,
    doctorId: 2,
    status: AppointmentStatus.SCHEDULED,
    dateTime: new Date(Date.now() + 2 * HOUR),
    ...appointmentOverrides,
  }

  const appointmentRepository = {
    findById: jest.fn().mockResolvedValue(appointment),
    update: jest.fn().mockImplementation(async (_id, data) => ({ ...appointment, ...data })),
  } as any

  const auditLogService = { log: jest.fn().mockResolvedValue(undefined) } as any

  const service = new AppointmentService(
    appointmentRepository,
    {} as any,
    {} as any,
    auditLogService,
  )

  return { service, appointment, appointmentRepository, auditLogService }
}