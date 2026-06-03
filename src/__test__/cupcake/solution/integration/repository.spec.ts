import { AppointmentType, Gender } from "../../../../enums"
import { AppointmentRepository } from "../../../../repositories/AppointmentRepository"
import { DoctorRepository } from "../../../../repositories/DoctorRepository"
import { PatientRepository } from "../../../../repositories/PatientRepository"
import { closeDatabase, setupDatabase, truncateDatabase } from "../../../helpers/db"
import { AppointmentStatus } from "../setup"

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

describe('AppointmentRepository', () => {
  it('deve detectar sobreposição', async () => {
    // TODO: implementar teste
    
    const doctor = await doctorRepo.create({ 
      name: 'Dr. Smith', crm: '12345', 
      email: 'dr.smith@example.com', 
      phone: '123456789',
      specialty: 'Cardiologia',
      active: true,
      consultationDuration: 60
    })
    const patient = await patientRepo.create({ 
      name: 'John Doe', 
      cpf: '12882838282',
      active: true,
      gender: Gender.MALE,
      address: 'Rua Teste, 123',
      emergencyContact: '123456789',
      dateOfBirth: '1990-01-01',
      phone: '123456789',
      email: 'john@example.com'
    } as any)

    // CENARIO
    const startAppointment = new Date()
    const endAppointment = new Date(startAppointment.getTime() + 60 * 60 * 1000) // 1 hour later

    await appointmentRepo.create({
      doctorId: doctor.id,
      patientId: patient.id,
      status: AppointmentStatus.SCHEDULED,
      type: AppointmentType.FOLLOW_UP,
      dateTime: startAppointment,
      endTime: endAppointment
    })

    const newAppointmentStart = new Date(startAppointment.getTime() + 30 * 60 * 1000)
    const newAppointmentEnd = new Date(startAppointment.getTime() + 90 * 60 * 1000)

    const result = await appointmentRepo.findConflicting(doctor.id, newAppointmentStart, newAppointmentEnd)

    expect(result).toHaveLength(1)
    expect(result[0]).toStrictEqual(expect.objectContaining({
      id: expect.any(Number),
      doctorId: doctor.id,
      patientId: patient.id,
      status: AppointmentStatus.SCHEDULED,
      type: AppointmentType.FOLLOW_UP,
      dateTime: startAppointment,
      endTime: endAppointment
    }))
  })
})



