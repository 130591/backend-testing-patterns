import { Router } from 'express'
import Container from 'typedi'
import { MedicalRecordController } from '../controllers/MedicalRecordController'

export function createMedicalRecordRoutes(): Router {
  const router = Router()
  const controller = Container.get(MedicalRecordController)

  router.get('/patient/:patientId', (req, res) => controller.findByPatientId(req, res))
  router.get('/:id', (req, res) => controller.findById(req, res))
  router.post('/', (req, res) => controller.create(req, res))
  router.put('/:id', (req, res) => controller.update(req, res))

  return router
}
