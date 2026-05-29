import request from 'supertest'
import type { Application } from 'express'
import { createApp } from '../../../../app'
import { setupDatabase, truncateDatabase, closeDatabase } from '../../../helpers/db'

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
  it('deve cobrar taxa de 50%  quando cancela com menos de 24h', async () => {
    const patient = await request(app).post('/patients').send({
      name: 'João Silva',
      cpf: '12345678900',
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      phone: '11999999999',
      email: 'joao@email.com',
    })

    // 2. Precisa criar um médico no banco
    const doctor = await request(app).post('/doctors').send({
      name: 'Dra. Maria',
      crm: 'CRM12345',
      email: 'maria@email.com',
      phone: '11988887777',
      specialty: 'CARDIOLOGY',
      availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      consultationDuration: 30,
    })

    // 3. Precisa agendar um appointment para daqui 2h
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const appointment = await request(app).post('/appointments').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      dateTime: twoHoursFromNow.toISOString(),
      type: 'FIRST_VISIT',
    })

    // 4. Finalmente, cancela
    const res = await request(app)
      .patch(`/appointments/${appointment.body.id}/cancel`)
      .send({ reason: 'Imprevisto' })

    // 5. Valida a taxa
    expect(res.status).toBe(200)
    expect(res.body.fee).toBe(0.5) // 50%
    
  })
})

describe('PATCH /appointments/:id/complete', () => {
  it('deve completar um appointment', async () => {
     const patient = await request(app).post('/patients').send({
      name: 'João Silva',
      cpf: '12345678900',
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      phone: '11999999999',
      email: 'joao@email.com',
    })

    // 2. Precisa criar um médico no banco
    const doctor = await request(app).post('/doctors').send({
      name: 'Dra. Maria',
      crm: 'CRM12345',
      email: 'maria@email.com',
      phone: '11988887777',
      specialty: 'CARDIOLOGY',
      availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      consultationDuration: 30,
    })

    // 3. Precisa agendar um appointment para daqui 2h
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const appointment = await request(app).post('/appointments').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      dateTime: twoHoursFromNow.toISOString(),
      type: 'FIRST_VISIT',
    })

    await request(app).patch(`/appointments/${appointment.body.id}/confirm`)
    await request(app).patch(`/appointments/${appointment.body.id}/start`)

    const res = await request(app).patch(`/appointments/${appointment.body.id}/complete`)
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('COMPLETED')
  })
})

// ANTIPATTERN: ice-cream-cone — validação de payload testada via E2E.
// Cada caso abaixo recria paciente + médico + consulta + prontuário só para
// disparar um `throw new AppError(...)` síncrono em PrescriptionService.create.
// O lugar certo para esses testes é um unitário no validador (ou um schema
// zod/yup testado isoladamente). Mantido aqui de propósito como exemplo do
// antipattern.
describe('POST /prescriptions — validação de medicamentos (ANTIPATTERN E2E)', () => {
  it('deve rejeitar quando medications é array vazio', async () => {
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

    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const appointment = await request(app).post('/appointments').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      dateTime: twoHoursFromNow.toISOString(),
      type: 'FIRST_VISIT',
    })

    const record = await request(app).post('/medical-records').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      appointmentId: appointment.body.id,
      chiefComplaint: 'Dor de cabeça',
    })

    const res = await request(app).post('/prescriptions').send({
      medicalRecordId: record.body.id,
      doctorId: doctor.body.id,
      patientId: patient.body.id,
      medications: [],
    })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/at least one medication/i)
  })

  it('deve rejeitar quando medication não tem name', async () => {
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

    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const appointment = await request(app).post('/appointments').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      dateTime: twoHoursFromNow.toISOString(),
      type: 'FIRST_VISIT',
    })

    const record = await request(app).post('/medical-records').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      appointmentId: appointment.body.id,
      chiefComplaint: 'Dor de cabeça',
    })

    const res = await request(app).post('/prescriptions').send({
      medicalRecordId: record.body.id,
      doctorId: doctor.body.id,
      patientId: patient.body.id,
      medications: [
        { dosage: '500mg', frequency: '8/8h', duration: '7 dias', instructions: '' },
      ],
    })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/name, dosage, frequency and duration/i)
  })

  it('deve rejeitar quando medication não tem dosage', async () => {
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

    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const appointment = await request(app).post('/appointments').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      dateTime: twoHoursFromNow.toISOString(),
      type: 'FIRST_VISIT',
    })

    const record = await request(app).post('/medical-records').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      appointmentId: appointment.body.id,
      chiefComplaint: 'Dor de cabeça',
    })

    const res = await request(app).post('/prescriptions').send({
      medicalRecordId: record.body.id,
      doctorId: doctor.body.id,
      patientId: patient.body.id,
      medications: [
        { name: 'Dipirona', frequency: '8/8h', duration: '7 dias', instructions: '' },
      ],
    })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/name, dosage, frequency and duration/i)
  })

  it('deve rejeitar quando medication não tem frequency', async () => {
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

    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const appointment = await request(app).post('/appointments').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      dateTime: twoHoursFromNow.toISOString(),
      type: 'FIRST_VISIT',
    })

    const record = await request(app).post('/medical-records').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      appointmentId: appointment.body.id,
      chiefComplaint: 'Dor de cabeça',
    })

    const res = await request(app).post('/prescriptions').send({
      medicalRecordId: record.body.id,
      doctorId: doctor.body.id,
      patientId: patient.body.id,
      medications: [
        { name: 'Dipirona', dosage: '500mg', duration: '7 dias', instructions: '' },
      ],
    })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/name, dosage, frequency and duration/i)
  })

  it('deve rejeitar quando medication não tem duration', async () => {
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

    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const appointment = await request(app).post('/appointments').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      dateTime: twoHoursFromNow.toISOString(),
      type: 'FIRST_VISIT',
    })

    const record = await request(app).post('/medical-records').send({
      patientId: patient.body.id,
      doctorId: doctor.body.id,
      appointmentId: appointment.body.id,
      chiefComplaint: 'Dor de cabeça',
    })

    const res = await request(app).post('/prescriptions').send({
      medicalRecordId: record.body.id,
      doctorId: doctor.body.id,
      patientId: patient.body.id,
      medications: [
        { name: 'Dipirona', dosage: '500mg', frequency: '8/8h', instructions: '' },
      ],
    })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/name, dosage, frequency and duration/i)
  })
})