import request from 'supertest'
import Container from 'typedi'
import { createApp } from '../../../../app'
import { AppointmentService } from '../../../../services/AppointmentService'
import { AppointmentStatus } from '../../../../enums'

describe('PATCH /appointments/:id/cancel — wiring HTTP', () => {
  let app: ReturnType<typeof createApp>
  let cancelMock: jest.Mock

  beforeAll(() => {
    cancelMock = jest.fn().mockResolvedValue({
      appointment: { id: 1, status: AppointmentStatus.CANCELLED },
      fee: 0.5,
    })

    Container.set(AppointmentService, { cancel: cancelMock } as any)
    app = createApp()
  })

  afterAll(() => {
    Container.reset()
  })

  it('roteia o id e o body para o service e devolve 200 com appointment + fee', async () => {
    const res = await request(app)
      .patch('/appointments/1/cancel')
      .send({ reason: 'Imprevisto' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('appointment')
    expect(res.body).toHaveProperty('fee')

    expect(cancelMock).toHaveBeenCalledWith(1, { reason: 'Imprevisto' })
  })
})
