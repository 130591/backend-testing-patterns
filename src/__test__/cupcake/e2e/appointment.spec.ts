import request from 'supertest'
import type { Application } from 'express'
import { createApp } from '../../../app'
import { setupDatabase, truncateDatabase, closeDatabase } from '../../helpers/db'

let app: Application

beforeAll(async () => {
  await setupDatabase()
  app = createApp()
})

beforeEach(async () => {
  await truncateDatabase()
})

afterAll(async () => {
  await closeDatabase()
})

describe('POST /appointments', () => {
  it('shold return 409 when scheduling overlapping appointment', async () => {
    const patient = await request(app).post('/patients').send({
      name: 'João Silva',
      cpf: '12345678900',
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      phone: '11999999999',
      email: 'joao@email.com',
    })

    const doctor = await request(app).post('/doctors').send({
      name: 'Dra. Maria',
      crm: 'CRM12345',
      email: 'maria@email.com',
      phone: '11988887777',
      specialty: 'CARDIOLOGY',
      availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      consultationDuration: 30,
    })

    const dateTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

    await request(app).post('/appointments').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      dateTime,
      type: 'FIRST_VISIT',
    })

    const res = await request(app).post('/appointments').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      dateTime,
      type: 'FIRST_VISIT',
    })

    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Doctor already has an appointment at this time')
  })
})
