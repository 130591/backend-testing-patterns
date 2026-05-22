import { Router } from 'express'
import Container from 'typedi'
import { ExamRequestController } from '../controllers/ExamRequestController'

export function createExamRequestRoutes(): Router {
  const router = Router()
  const controller = Container.get(ExamRequestController)

  router.get('/patient/:patientId', (req, res) => controller.findByPatientId(req, res))
  router.get('/:id', (req, res) => controller.findById(req, res))
  router.post('/', (req, res) => controller.create(req, res))
  router.patch('/:id/status', (req, res) => controller.updateStatus(req, res))

  return router
}
