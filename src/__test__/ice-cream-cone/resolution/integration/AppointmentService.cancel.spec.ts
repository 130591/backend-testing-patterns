import { AppointmentStatus } from '../../../../enums'
import { setup } from '../fixtures/setup'

describe('AppointmentService.cancel — orquestração', () => {
  it('persiste status CANCELLED, motivo e timestamp', async () => {
    const { service, appointmentRepository } = setup()

    await service.cancel(42, { reason: 'Imprevisto' })

    expect(appointmentRepository.update).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        status: AppointmentStatus.CANCELLED,
        cancellationReason: 'Imprevisto',
        cancelledAt: expect.any(Date),
      }),
    )
  })

  it('registra audit log com old/new status e fee', async () => {
    const { service, auditLogService } = setup()

    await service.cancel(42, { reason: 'Imprevisto' })

    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CANCEL',
        entity: 'Appointment',
        entityId: 42,
        oldValue: { status: AppointmentStatus.SCHEDULED },
        newValue: expect.objectContaining({
          status: AppointmentStatus.CANCELLED,
          reason: 'Imprevisto',
          fee: expect.any(Number),
        }),
      }),
    )
  })

  it('lança 404 quando appointment não existe', async () => {
    const { service, appointmentRepository } = setup()
    appointmentRepository.findById.mockResolvedValueOnce(null)

    await expect(service.cancel(999, { reason: 'x' })).rejects.toThrow('Appointment not found')
    expect(appointmentRepository.update).not.toHaveBeenCalled()
  })

  it('bloqueia cancelar appointment já COMPLETED', async () => {
    const { service, appointmentRepository, auditLogService } = setup({ status: AppointmentStatus.COMPLETED })

    await expect(service.cancel(42, { reason: 'tarde demais' })).rejects.toThrow(/Cannot transition/)
    expect(appointmentRepository.update).not.toHaveBeenCalled()
    expect(auditLogService.log).not.toHaveBeenCalled()
  })

  it('bloqueia cancelar appointment já CANCELLED', async () => {
    const { service, appointmentRepository } = setup({ status: AppointmentStatus.CANCELLED })

    await expect(service.cancel(42, { reason: 'de novo' })).rejects.toThrow(/Cannot transition/)
    expect(appointmentRepository.update).not.toHaveBeenCalled()
  })
})
