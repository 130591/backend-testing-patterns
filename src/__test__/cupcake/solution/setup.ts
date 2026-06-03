import { AppointmentStatus } from "../../../enums"
import { AppointmentService } from "../../../services/AppointmentService"

const HOUR = 60 * 60 * 1000

/**
 * Fixture compartilhada do nível UNIT.
 *
 * Aqui as dependências são TODAS dubladas (mocks) de propósito: o unit é dono
 * apenas das DECISÕES PURAS do service. Quem prova a query real de sobreposição
 * é a integração — não este arquivo.
 */
export function setup(
  overrides: Partial<{
    conflicts: unknown[]
    patientConflicts: unknown[]
    doctorActive: boolean
    patientActive: boolean
  }> = {},
) {
  const dateTime = new Date(Date.now() + 2 * HOUR)

  const appointmentRepository = {
    findConflicting: jest.fn().mockResolvedValue(overrides.conflicts ?? []),
    findPatientConflicting: jest.fn().mockResolvedValue(overrides.patientConflicts ?? []),
    create: jest.fn().mockImplementation(async (data) => ({ id: 1, ...data })),
  } as any

  const doctorRepository = {
    findById: jest.fn().mockResolvedValue({
      id: 1,
      name: 'Dr. Smith',
      active: overrides.doctorActive ?? true,
      consultationDuration: 30,
      availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    }),
  } as any

  const patientRepository = {
    findById: jest.fn().mockResolvedValue({
      id: 1,
      name: 'John Doe',
      active: overrides.patientActive ?? true,
    }),
  } as any

  const auditLogService = { log: jest.fn().mockResolvedValue(undefined) } as any

  const service = new AppointmentService(
    appointmentRepository,
    doctorRepository,
    patientRepository,
    auditLogService,
  )

  const scheduleInput = {
    patientId: 1,
    doctorId: 1,
    dateTime,
    type: 'FIRST_VISIT',
    notes: 'Test appointment',
  }

  return { service, appointmentRepository, doctorRepository, patientRepository, auditLogService, scheduleInput }
}

export { AppointmentStatus }
