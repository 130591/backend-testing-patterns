import { Router } from 'express'
import Container from 'typedi'
import { PrescriptionController } from '../controllers/PrescriptionController'

export function createPrescriptionRoutes(): Router {
  const router = Router()
  const controller = Container.get(PrescriptionController)

  router.get('/patient/:patientId', (req, res) => controller.findByPatientId(req, res))
  router.get('/:id', (req, res) => controller.findById(req, res))
  router.post('/', (req, res) => controller.create(req, res))

  return router
}
