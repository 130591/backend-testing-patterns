import { Service } from 'typedi'
import { Appointment } from '../entities/Appointment'
import { AppointmentStatus } from '../enums'
import { AppointmentRepository } from '../repositories/AppointmentRepository'
import { DoctorRepository } from '../repositories/DoctorRepository'
import { PatientRepository } from '../repositories/PatientRepository'
import { AuditLogService } from './AuditLogService'
import { AppError } from '../errors/AppError'

const CANCELLATION_FEE_PERCENTAGE = 0.5
const CANCELLATION_FREE_HOURS = 24

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.SCHEDULED]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
  [AppointmentStatus.CONFIRMED]: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
  [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
}

@Service()
export class AppointmentService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly doctorRepository: DoctorRepository,
    private readonly patientRepository: PatientRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepository.findAll()
  }

  async findById(id: number): Promise<Appointment | null> {
    return this.appointmentRepository.findById(id)
  }

  async findByPatientId(patientId: number): Promise<Appointment[]> {
    return this.appointmentRepository.findByPatientId(patientId)
  }

  async findByDoctorId(doctorId: number): Promise<Appointment[]> {
    return this.appointmentRepository.findByDoctorId(doctorId)
  }

  async schedule(data: {
    patientId: number
    doctorId: number
    dateTime: Date
    type: string
    notes?: string
  }): Promise<Appointment> {
    const patient = await this.patientRepository.findById(data.patientId)
    if (!patient || !patient.active) {
      throw new AppError('Patient not found or inactive', 404)
    }

    const doctor = await this.doctorRepository.findById(data.doctorId)
    if (!doctor || !doctor.active) {
      throw new AppError('Doctor not found or inactive', 404)
    }

    const dateTime = new Date(data.dateTime)
    const endTime = new Date(dateTime)
    endTime.setMinutes(endTime.getMinutes() + doctor.consultationDuration)

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    const dayOfWeek = dayNames[dateTime.getDay()]
    if (!doctor.availableDays.includes(dayOfWeek)) {
      throw new AppError('Doctor is not available on this day', 400)
    }

    const doctorConflicts = await this.appointmentRepository.findConflicting(data.doctorId, dateTime, endTime)
    if (doctorConflicts.length > 0) {
      throw new AppError('Doctor already has an appointment at this time', 409)
    }

    const patientConflicts = await this.appointmentRepository.findPatientConflicting(data.patientId, dateTime, endTime)
    if (patientConflicts.length > 0) {
      throw new AppError('Patient already has an appointment at this time', 409)
    }

    const appointment = await this.appointmentRepository.create({
      patientId: data.patientId,
      doctorId: data.doctorId,
      dateTime,
      endTime,
      type: data.type as Appointment['type'],
      notes: data.notes ?? null,
      status: AppointmentStatus.SCHEDULED,
    })

    await this.auditLogService.log({
      action: 'SCHEDULE',
      entity: 'Appointment',
      entityId: appointment.id,
      newValue: data as unknown as Record<string, unknown>,
    })

    return appointment
  }

  async cancel(id: number, data: { reason: string }): Promise<{ appointment: Appointment; fee: number }> {
    const appointment = await this.appointmentRepository.findById(id)
    if (!appointment) {
      throw new AppError('Appointment not found', 404)
    }

    this.validateStatusTransition(appointment.status, AppointmentStatus.CANCELLED)

    const hoursUntilAppointment = (new Date(appointment.dateTime).getTime() - Date.now()) / (1000 * 60 * 60)
    const fee = hoursUntilAppointment < CANCELLATION_FREE_HOURS ? CANCELLATION_FEE_PERCENTAGE : 0

    const updated = await this.appointmentRepository.update(id, {
      status: AppointmentStatus.CANCELLED,
      cancellationReason: data.reason,
      cancelledAt: new Date(),
    })

    await this.auditLogService.log({
      action: 'CANCEL',
      entity: 'Appointment',
      entityId: id,
      oldValue: { status: appointment.status },
      newValue: { status: AppointmentStatus.CANCELLED, reason: data.reason, fee },
    })

    return { appointment: updated!, fee }
  }

  async confirm(id: number): Promise<Appointment> {
    return this.transitionStatus(id, AppointmentStatus.CONFIRMED, 'CONFIRM')
  }

  async startConsultation(id: number): Promise<Appointment> {
    return this.transitionStatus(id, AppointmentStatus.IN_PROGRESS, 'START_CONSULTATION')
  }

  async complete(id: number): Promise<Appointment> {
    return this.transitionStatus(id, AppointmentStatus.COMPLETED, 'COMPLETE')
  }

  async markNoShow(id: number): Promise<Appointment> {
    return this.transitionStatus(id, AppointmentStatus.NO_SHOW, 'MARK_NO_SHOW')
  }

  private async transitionStatus(id: number, target: AppointmentStatus, action: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(id)
    if (!appointment) {
      throw new AppError('Appointment not found', 404)
    }

    this.validateStatusTransition(appointment.status, target)

    const updated = await this.appointmentRepository.update(id, { status: target })

    await this.auditLogService.log({
      action,
      entity: 'Appointment',
      entityId: id,
      oldValue: { status: appointment.status },
      newValue: { status: target },
    })

    return updated!
  }

  private validateStatusTransition(current: AppointmentStatus, target: AppointmentStatus): void {
    if (!VALID_TRANSITIONS[current].includes(target)) {
      throw new AppError(`Cannot transition from ${current} to ${target}`, 400)
    }
  }
}
