import type { Application } from 'express'
import request from 'supertest'
import { closeDatabase, setupDatabase, truncateDatabase } from '../../../helpers/db'
import { createApp } from '../../../../app'

let app: Application

describe('Appointment E2E Tests', () => {
  
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
  
  it('deve criar um appointment corretamente', async () => {
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

    const res = await request(app).post('/appointments').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      dateTime,
      type: 'FIRST_VISIT',
    })
    
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.patientId).toBe(patient.body.id)
    expect(res.body.doctorId).toBe(doctor.body.id)
    expect(res.body.dateTime).toBe(dateTime)
    expect(res.body.type).toBe('FIRST_VISIT')
  })  
})