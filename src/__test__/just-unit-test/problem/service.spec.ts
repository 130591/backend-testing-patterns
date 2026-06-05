import { AnalyticsService } from "../../../analytics/AnalyticsService";
import { AppDataSource } from "../../../config/data-source";

describe('AnalyticsService', () => {
  it('deve calcular a taxa de no-show', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn()
                  .mockResolvedValueOnce(10)
                  .mockResolvedValueOnce(3)
    }

    jest.spyOn(AppDataSource, 'getRepository').mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as any)

    const service = new AnalyticsService()
    const startDate = new Date('2025-01-01')
    const endDate = new Date('2025-12-31')
    const result = await service.getNoShowRate(startDate,endDate)
    
    expect(result).toEqual({
      totalAppointments: 10,
      noShows: 3,
      noShowRate: 30
    })
  })

  it("deve calcular estatísticas de pacientes", async () => {
    const qb = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ count: 2 }]),
      getRawOne: jest.fn().mockResolvedValue({ count: 3 }),
      getCount: jest.fn()
                  .mockResolvedValueOnce(5)
                  .mockResolvedValueOnce(3)
    }

    jest.spyOn(AppDataSource, 'getRepository').mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as any)

    const service = new AnalyticsService()
    const startDate = new Date('2025-01-01')
    const endDate = new Date('2025-12-31')
    const result = await service.getPatientStats(startDate,endDate)
    
    expect(result).toEqual({
      newPatients: 5,
      activePatients: 3, 
      returningPatients: 2
    })
  })
})