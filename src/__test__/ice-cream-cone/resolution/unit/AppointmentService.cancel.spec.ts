import { AppointmentService } from '../../../../services/AppointmentService'
import { AppointmentStatus } from '../../../../enums'

const HOUR = 60 * 60 * 1000

function makeService(appointmentOverrides: Partial<{ status: AppointmentStatus; dateTime: Date }> = {}) {
  const appointment = {
    id: 1,
    status: AppointmentStatus.SCHEDULED,
    dateTime: new Date(Date.now() + 48 * HOUR),
    ...appointmentOverrides,
  }

  const appointmentRepository = {
    findById: jest.fn().mockResolvedValue(appointment),
    update: jest.fn().mockResolvedValue({ ...appointment, status: AppointmentStatus.CANCELLED }),
  } as any

  const auditLogService = { log: jest.fn().mockResolvedValue(undefined) } as any

  const service = new AppointmentService(
    appointmentRepository,
    {} as any,
    {} as any,
    auditLogService,
  )

  return { service, appointmentRepository, auditLogService }
}

describe('AppointmentService.cancel — regra da taxa de cancelamento', () => {
  const NOW = new Date('2026-05-28T12:00:00Z').getTime()

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it.each([
    ['2h antes',       NOW + 2 * HOUR,        0.5],
    ['23h59 antes',    NOW + 23 * HOUR + 59 * 60 * 1000, 0.5],
    ['24h exatos',     NOW + 24 * HOUR,       0],
    ['24h01 antes',    NOW + 24 * HOUR + 60 * 1000, 0],
    ['48h antes',      NOW + 48 * HOUR,       0],
    ['no passado',     NOW - 1 * HOUR,        0.5],
  ])('cobra %s -> fee %s', async (_label, dateTimeMs, expectedFee) => {
    const { service } = makeService({ dateTime: new Date(dateTimeMs) })

    const result = await service.cancel(1, { reason: 'Imprevisto' })

    expect(result.fee).toBe(expectedFee)
  })
})
