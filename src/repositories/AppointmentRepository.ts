import { Service } from 'typedi'
import { Repository, Not, In, LessThan, MoreThan, Between } from 'typeorm'
import { Appointment } from '../entities/Appointment'
import { AppointmentStatus } from '../enums'
import { AppDataSource } from '../config/data-source'

@Service()
export class AppointmentRepository {
  private repository: Repository<Appointment>

  constructor() {
    this.repository = AppDataSource.getRepository(Appointment)
  }

  async findAll(): Promise<Appointment[]> {
    return this.repository.find()
  }

  async findById(id: number): Promise<Appointment | null> {
    return this.repository.findOneBy({ id })
  }

  async findByPatientId(patientId: number): Promise<Appointment[]> {
    return this.repository.find({ where: { patientId } })
  }

  async findByDoctorId(doctorId: number): Promise<Appointment[]> {
    return this.repository.find({ where: { doctorId } })
  }

  async findConflicting(doctorId: number, dateTime: Date, endTime: Date): Promise<Appointment[]> {
    return this.repository.find({
      where: {
        doctorId,
        status: Not(In([AppointmentStatus.CANCELLED])),
        dateTime: LessThan(endTime),
        endTime: MoreThan(dateTime),
      },
    })
  }

  async findPatientConflicting(patientId: number, dateTime: Date, endTime: Date): Promise<Appointment[]> {
    return this.repository.find({
      where: {
        patientId,
        status: Not(In([AppointmentStatus.CANCELLED])),
        dateTime: LessThan(endTime),
        endTime: MoreThan(dateTime),
      },
    })
  }

  async findByDoctorAndDate(doctorId: number, date: Date): Promise<Appointment[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return this.repository.find({
      where: {
        doctorId,
        status: Not(In([AppointmentStatus.CANCELLED])),
        dateTime: Between(startOfDay, endOfDay),
      },
    })
  }

  async create(data: Partial<Appointment>): Promise<Appointment> {
    const appointment = this.repository.create(data)
    return this.repository.save(appointment)
  }

  async update(id: number, data: Partial<Appointment>): Promise<Appointment | null> {
    await this.repository.update(id, data)
    return this.findById(id)
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id)
  }
}
