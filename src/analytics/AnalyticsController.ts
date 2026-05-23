import { Service } from 'typedi'
import { Request, Response } from 'express'
import { AnalyticsService } from './AnalyticsService'

@Service()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  async getDashboard(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = this.parseDateRange(req)
    const dashboard = await this.analyticsService.getDashboard(startDate, endDate)
    res.json(dashboard)
  }

  async getOccupancyRate(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = this.parseDateRange(req)
    const doctorId = Number(req.params.doctorId)
    const result = await this.analyticsService.getOccupancyRate(doctorId, startDate, endDate)
    res.json(result)
  }

  async getNoShowRate(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = this.parseDateRange(req)
    const result = await this.analyticsService.getNoShowRate(startDate, endDate)
    res.json(result)
  }

  async getAverageConsultationTime(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = this.parseDateRange(req)
    const doctorId = Number(req.params.doctorId)
    const result = await this.analyticsService.getAverageConsultationTime(doctorId, startDate, endDate)
    res.json(result)
  }

  async getPatientStats(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = this.parseDateRange(req)
    const result = await this.analyticsService.getPatientStats(startDate, endDate)
    res.json(result)
  }

  async getRevenueByDoctor(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = this.parseDateRange(req)
    const result = await this.analyticsService.getRevenueByDoctor(startDate, endDate)
    res.json(result)
  }

  private parseDateRange(req: Request): { startDate: Date; endDate: Date } {
    const startDate = new Date(req.query.startDate as string || new Date().toISOString().slice(0, 8) + '01')
    const endDate = new Date(req.query.endDate as string || new Date().toISOString())
    return { startDate, endDate }
  }
}
