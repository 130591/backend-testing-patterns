import { Service } from 'typedi'
import { AppDataSource } from '../config/data-source'
import { Appointment } from '../entities/Appointment'
import { AppointmentStatus } from '../enums'

@Service()
export class AnalyticsService {
  private get appointmentRepo() {
    return AppDataSource.getRepository(Appointment)
  }

  async getOccupancyRate(doctorId: number, startDate: Date, endDate: Date): Promise<{
    totalSlots: number
    bookedSlots: number
    occupancyRate: number
  }> {
    const booked = await this.appointmentRepo
      .createQueryBuilder('a')
      .where('a.doctorId = :doctorId', { doctorId })
      .andWhere('a.dateTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('a.status != :cancelled', { cancelled: AppointmentStatus.CANCELLED })
      .getCount()

    const workDays = this.countWorkDays(startDate, endDate)
    const slotsPerDay = 20 // 10h workday / 30min avg
    const totalSlots = workDays * slotsPerDay

    return {
      totalSlots,
      bookedSlots: booked,
      occupancyRate: totalSlots > 0 ? Math.round((booked / totalSlots) * 100) : 0,
    }
  }

  async getNoShowRate(startDate: Date, endDate: Date): Promise<{
    totalAppointments: number
    noShows: number
    noShowRate: number
  }> {
    const total = await this.appointmentRepo
      .createQueryBuilder('a')
      .where('a.dateTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('a.status IN (:...statuses)', {
        statuses: [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW],
      })
      .getCount()

    const noShows = await this.appointmentRepo
      .createQueryBuilder('a')
      .where('a.dateTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('a.status = :status', { status: AppointmentStatus.NO_SHOW })
      .getCount()

    return {
      totalAppointments: total,
      noShows,
      noShowRate: total > 0 ? Math.round((noShows / total) * 100) : 0,
    }
  }

  async getAverageConsultationTime(doctorId: number, startDate: Date, endDate: Date): Promise<{
    averageMinutes: number
    totalConsultations: number
  }> {
    const result = await this.appointmentRepo
      .createQueryBuilder('a')
      .select('AVG(EXTRACT(EPOCH FROM (a.endTime - a.dateTime)) / 60)', 'avgMinutes')
      .addSelect('COUNT(*)', 'total')
      .where('a.doctorId = :doctorId', { doctorId })
      .andWhere('a.dateTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('a.status = :status', { status: AppointmentStatus.COMPLETED })
      .getRawOne()

    return {
      averageMinutes: Math.round(Number(result.avgMinutes) || 0),
      totalConsultations: Number(result.total),
    }
  }

  async getPatientStats(startDate: Date, endDate: Date): Promise<{
    newPatients: number
    activePatients: number
    returningPatients: number
  }> {
    const newPatients = await AppDataSource
      .createQueryBuilder()
      .from('patient', 'p')
      .where('p.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getCount()

    const activePatients = await this.appointmentRepo
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.patientId)', 'count')
      .where('a.dateTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('a.status != :cancelled', { cancelled: AppointmentStatus.CANCELLED })
      .getRawOne()

    const returningResult = await this.appointmentRepo
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.patientId)', 'count')
      .where('a.dateTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('a.status != :cancelled', { cancelled: AppointmentStatus.CANCELLED })
      .groupBy('a.patientId')
      .having('COUNT(*) > 1')
      .getRawMany()

    return {
      newPatients,
      activePatients: Number(activePatients?.count || 0),
      returningPatients: returningResult.length,
    }
  }

  async getRevenueByDoctor(startDate: Date, endDate: Date): Promise<{
    doctorId: number
    doctorName: string
    totalAppointments: number
    completedAppointments: number
  }[]> {
    const results = await this.appointmentRepo
      .createQueryBuilder('a')
      .leftJoin('a.doctor', 'd')
      .select('a.doctorId', 'doctorId')
      .addSelect('d.name', 'doctorName')
      .addSelect('COUNT(*)', 'totalAppointments')
      .addSelect(`SUM(CASE WHEN a.status = '${AppointmentStatus.COMPLETED}' THEN 1 ELSE 0 END)`, 'completedAppointments')
      .where('a.dateTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('a.doctorId')
      .addGroupBy('d.name')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany()

    return results.map((r) => ({
      doctorId: Number(r.doctorId),
      doctorName: r.doctorName,
      totalAppointments: Number(r.totalAppointments),
      completedAppointments: Number(r.completedAppointments),
    }))
  }

  async getDashboard(startDate: Date, endDate: Date): Promise<Record<string, unknown>> {
    const [noShowRate, patientStats, revenueByDoctor] = await Promise.all([
      this.getNoShowRate(startDate, endDate),
      this.getPatientStats(startDate, endDate),
      this.getRevenueByDoctor(startDate, endDate),
    ])

    return {
      period: { startDate, endDate },
      noShowRate,
      patientStats,
      revenueByDoctor,
    }
  }

  private countWorkDays(start: Date, end: Date): number {
    let count = 0
    const current = new Date(start)
    while (current <= end) {
      const day = current.getDay()
      if (day !== 0 && day !== 6) count++
      current.setDate(current.getDate() + 1)
    }
    return count
  }
}
