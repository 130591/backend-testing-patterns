import { AppDataSource } from "../../config/data-source"
import { Appointment } from "../../entities/Appointment"
import { Doctor } from "../../entities/Doctor"
import { Patient } from "../../entities/Patient"
import { AppointmentStatus, AppointmentType, Gender } from "../../enums"

export const createDoctor = async (overrides: Partial<Doctor> = {}): Promise<Doctor> => {
  const repo = AppDataSource.getRepository(Doctor)
  const doctor = repo.create({
    name: "Doctor",
    crm: "CRM-12345",
    email: "doctor@example.com",
    phone: "11999999999",
    specialty: "Cardiology",
    consultationDuration: 30,
    ...overrides,
  })
  return repo.save(doctor)
}

export const createPatient = async (overrides: Partial<Patient> = {}): Promise<Patient> => {
  const repo = AppDataSource.getRepository(Patient)
  const patient = repo.create({
    name: "Patient",
    cpf: "12345678900",
    email: "patient@example.com",
    phone: "11988888888",
    dateOfBirth: "1990-01-01",
    gender: Gender.OTHER,
    ...overrides,
  })
  return repo.save(patient)
}

export const createAppointment = async (appointment: {
  doctor: Doctor
  patient: Patient
  status: AppointmentStatus | string
  dateTime?: Date
}): Promise<Appointment> => {
  const repo = AppDataSource.getRepository(Appointment)
  const dateTime = appointment.dateTime ?? new Date("2025-06-01T10:00:00")
  const entity = repo.create({
    doctorId: appointment.doctor.id,
    patientId: appointment.patient.id,
    status: appointment.status as AppointmentStatus,
    type: AppointmentType.FIRST_VISIT,
    dateTime,
    endTime: new Date(dateTime.getTime() + 30 * 60 * 1000),
  })
  return repo.save(entity)
}


export const createPatientWithAppointments = async (overrides: Partial<Patient> = {}): Promise<Patient> => {
  const repo = AppDataSource.getRepository(Patient)
  // Ignora identidade vinda do override (id/cpf/email) para sempre inserir um
  // paciente novo e independente, evitando virar UPDATE ou colidir no unique.
  const { id, cpf, email, createdAt, ...safe } = overrides
  const patient = repo.create({
    name: "Patient",
    cpf: "98765432100",
    email: "patient.appointments@example.com",
    phone: "11977777777",
    dateOfBirth: "1990-01-01",
    gender: Gender.OTHER,
    ...safe,
  })
  const saved = await repo.save(patient)

  // @CreateDateColumn força NOW() no insert e ignora o valor passado; por isso
  // sobrescrevemos depois para um createdAt determinístico dentro da janela.
  // O createdAt vindo do override é descartado de propósito (seria o NOW do insert anterior).
  const fixedCreatedAt = new Date("2025-06-01T00:00:00")
  await repo.update(saved.id, { createdAt: fixedCreatedAt })
  saved.createdAt = fixedCreatedAt

  return saved
}