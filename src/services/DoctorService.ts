import { Service } from 'typedi'
import { Doctor } from '../entities/Doctor'
import { DoctorRepository } from '../repositories/DoctorRepository'
import { AppointmentRepository } from '../repositories/AppointmentRepository'
import { AuditLogService } from './AuditLogService'
import { AppError } from '../errors/AppError'

const DEFAULT_WORKING_HOURS = { start: 8, end: 18 }

@Service()
export class DoctorService {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(): Promise<Doctor[]> {
    return this.doctorRepository.findAll()
  }

  async findById(id: number): Promise<Doctor | null> {
    return this.doctorRepository.findById(id)
  }

  async findByCrm(crm: string): Promise<Doctor | null> {
    return this.doctorRepository.findByCrm(crm)
  }

  async findBySpecialty(specialty: string): Promise<Doctor[]> {
    return this.doctorRepository.findBySpecialty(specialty)
  }

  async getAvailableSlots(doctorId: number, date: Date): Promise<{ start: Date; end: Date }[]> {
    const doctor = await this.doctorRepository.findById(doctorId)
    if (!doctor) {
      throw new AppError('Doctor not found', 404)
    }

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    const dayOfWeek = dayNames[date.getDay()]

    if (!doctor.availableDays.includes(dayOfWeek)) {
      throw new AppError('Doctor is not available on this day', 400)
    }

    const existingAppointments = await this.appointmentRepository.findByDoctorAndDate(doctorId, date)

    const slots: { start: Date; end: Date }[] = []
    const duration = doctor.consultationDuration

    for (let hour = DEFAULT_WORKING_HOURS.start; hour < DEFAULT_WORKING_HOURS.end; ) {
      const slotStart = new Date(date)
      slotStart.setHours(hour, 0, 0, 0)

      const slotEnd = new Date(slotStart)
      slotEnd.setMinutes(slotEnd.getMinutes() + duration)

      if (slotEnd.getHours() > DEFAULT_WORKING_HOURS.end ||
        (slotEnd.getHours() === DEFAULT_WORKING_HOURS.end && slotEnd.getMinutes() > 0)) {
        break
      }

      const hasConflict = existingAppointments.some((apt) => {
        const aptStart = new Date(apt.dateTime)
        const aptEnd = new Date(apt.endTime)
        return slotStart < aptEnd && slotEnd > aptStart
      })

      if (!hasConflict) {
        slots.push({ start: slotStart, end: slotEnd })
      }

      hour = slotEnd.getHours() + (slotEnd.getMinutes() > 0 ? 1 : 0)
      if (slotEnd.getMinutes() > 0) {
        // Move to the next slot boundary
        const minutesIntoHour = slotEnd.getMinutes()
        const totalMinutes = hour * 60 + minutesIntoHour - 60
        hour = Math.floor(totalMinutes / 60)
      }
      // Advance by consultation duration in minutes
      const nextStart = new Date(slotStart)
      nextStart.setMinutes(nextStart.getMinutes() + duration)
      hour = nextStart.getHours()
      if (nextStart.getMinutes() > 0 && hour >= DEFAULT_WORKING_HOURS.end) break
    }

    return slots
  }

  async create(data: Partial<Doctor>): Promise<Doctor> {
    const doctor = await this.doctorRepository.create(data)
    await this.auditLogService.log({
      action: 'CREATE',
      entity: 'Doctor',
      entityId: doctor.id,
      newValue: data as Record<string, unknown>,
    })
    return doctor
  }

  async update(id: number, data: Partial<Doctor>): Promise<Doctor | null> {
    const existing = await this.doctorRepository.findById(id)
    if (!existing) return null

    const doctor = await this.doctorRepository.update(id, data)
    await this.auditLogService.log({
      action: 'UPDATE',
      entity: 'Doctor',
      entityId: id,
      oldValue: existing as unknown as Record<string, unknown>,
      newValue: data as Record<string, unknown>,
    })
    return doctor
  }

  async delete(id: number): Promise<void> {
    await this.auditLogService.log({
      action: 'DELETE',
      entity: 'Doctor',
      entityId: id,
    })
    await this.doctorRepository.delete(id)
  }
}
