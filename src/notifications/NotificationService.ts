import { Service } from 'typedi'
import { EmailService } from './EmailService'
import { SmsService } from './SmsService'
import { PatientRepository } from '../repositories/PatientRepository'
import { DoctorRepository } from '../repositories/DoctorRepository'
import { AppointmentRepository } from '../repositories/AppointmentRepository'
import { AppointmentStatus } from '../enums'

@Service()
export class NotificationService {
  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly patientRepository: PatientRepository,
    private readonly doctorRepository: DoctorRepository,
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async notifyAppointmentScheduled(appointmentId: number): Promise<void> {
    const appointment = await this.appointmentRepository.findById(appointmentId)
    if (!appointment) return

    const [patient, doctor] = await Promise.all([
      this.patientRepository.findById(appointment.patientId),
      this.doctorRepository.findById(appointment.doctorId),
    ])
    if (!patient || !doctor) return

    await Promise.allSettled([
      this.emailService.sendAppointmentConfirmation(
        patient.email, patient.name, doctor.name, new Date(appointment.dateTime),
      ),
      this.smsService.sendAppointmentConfirmation(
        patient.phone, patient.name, doctor.name, new Date(appointment.dateTime),
      ),
    ])
  }

  async notifyAppointmentCancelled(appointmentId: number, fee: number): Promise<void> {
    const appointment = await this.appointmentRepository.findById(appointmentId)
    if (!appointment) return

    const [patient, doctor] = await Promise.all([
      this.patientRepository.findById(appointment.patientId),
      this.doctorRepository.findById(appointment.doctorId),
    ])
    if (!patient || !doctor) return

    await this.emailService.sendCancellationNotice(
      patient.email, patient.name, doctor.name, new Date(appointment.dateTime), fee,
    )
  }

  async sendPendingReminders(): Promise<{ sent: number }> {
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const appointments = await this.appointmentRepository.findAll()
    const upcoming = appointments.filter((a) => {
      const dt = new Date(a.dateTime)
      return dt > now && dt <= in24h &&
        (a.status === AppointmentStatus.SCHEDULED || a.status === AppointmentStatus.CONFIRMED)
    })

    let sent = 0
    for (const appointment of upcoming) {
      const [patient, doctor] = await Promise.all([
        this.patientRepository.findById(appointment.patientId),
        this.doctorRepository.findById(appointment.doctorId),
      ])
      if (!patient || !doctor) continue

      await Promise.allSettled([
        this.emailService.sendAppointmentReminder(
          patient.email, patient.name, doctor.name, new Date(appointment.dateTime),
        ),
        this.smsService.sendAppointmentReminder(
          patient.phone, patient.name, doctor.name, new Date(appointment.dateTime),
        ),
      ])
      sent++
    }

    return { sent }
  }
}
