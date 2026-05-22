import { Router } from 'express'
import Container from 'typedi'
import { AppointmentController } from '../controllers/AppointmentController'

export function createAppointmentRoutes(): Router {
  const router = Router()
  const controller = Container.get(AppointmentController)

  router.get('/', (req, res) => controller.findAll(req, res))
  router.get('/:id', (req, res) => controller.findById(req, res))
  router.post('/', (req, res) => controller.create(req, res))
  router.patch('/:id/cancel', (req, res) => controller.cancel(req, res))
  router.patch('/:id/confirm', (req, res) => controller.confirm(req, res))
  router.patch('/:id/start', (req, res) => controller.startConsultation(req, res))
  router.patch('/:id/complete', (req, res) => controller.complete(req, res))
  router.patch('/:id/no-show', (req, res) => controller.markNoShow(req, res))

  return router
}
