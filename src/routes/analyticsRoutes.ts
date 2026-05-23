import { Router } from 'express'
import Container from 'typedi'
import { AnalyticsController } from '../analytics/AnalyticsController'

export function createAnalyticsRoutes(): Router {
  const router = Router()
  const controller = Container.get(AnalyticsController)

  router.get('/dashboard', (req, res) => controller.getDashboard(req, res))
  router.get('/occupancy/:doctorId', (req, res) => controller.getOccupancyRate(req, res))
  router.get('/no-show-rate', (req, res) => controller.getNoShowRate(req, res))
  router.get('/consultation-time/:doctorId', (req, res) => controller.getAverageConsultationTime(req, res))
  router.get('/patients', (req, res) => controller.getPatientStats(req, res))
  router.get('/revenue/doctors', (req, res) => controller.getRevenueByDoctor(req, res))

  return router
}
