import { AppointmentRepository } from '../../../repositories/AppointmentRepository'
import { DoctorRepository } from '../../../repositories/DoctorRepository'
import { PatientRepository } from '../../../repositories/PatientRepository'
import { AppointmentStatus } from '../../../enums'
import { setupDatabase, truncateDatabase, closeDatabase } from '../../helpers/db'

let appointmentRepo: AppointmentRepository
let doctorRepo: DoctorRepository
let patientRepo: PatientRepository

beforeAll(async () => {
  await setupDatabase()
  appointmentRepo = new AppointmentRepository()
  doctorRepo = new DoctorRepository()
  patientRepo = new PatientRepository()
})

beforeEach(async () => {
  await truncateDatabase()
})

afterAll(async () => {
  await closeDatabase()
})

describe('AppointmentRepository.findConflicting', () => {
  it('Deve retornar conflito quando o novo horário se sobrepõe ao fim de um agendamento existente', async () => {
    // seed (se houver FK no schema, precisa do doctor/patient antes)
    const patient = await patientRepo.create({ name: 'João Silva', active: true } as any)
    const doctor = await doctorRepo.create({ name: 'Dra. Maria', active: true, consultationDuration: 30 } as any)

    const dateTime = new Date('2026-06-01T10:00:00Z')
    const endTime = new Date('2026-06-01T10:30:00Z')

    await appointmentRepo.create({
      doctorId: doctor.id,
      patientId: patient.id,
      dateTime,
      endTime,
      type: 'FIRST_VISIT' as any,
      status: AppointmentStatus.SCHEDULED,
    })

    // novo agendamento começa 10:15, dentro da janela anterior
    const newStart = new Date('2026-06-01T10:15:00Z')
    const newEnd = new Date('2026-06-01T10:45:00Z')

    const result = await appointmentRepo.findConflicting(doctor.id, newStart, newEnd)

    expect(result).toHaveLength(1)
    expect(result[0].doctorId).toBe(doctor.id)
  })
})