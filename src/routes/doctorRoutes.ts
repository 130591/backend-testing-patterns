import { Router } from 'express'
import Container from 'typedi'
import { DoctorController } from '../controllers/DoctorController'

export function createDoctorRoutes(): Router {
  const router = Router()
  const controller = Container.get(DoctorController)

  router.get('/', (req, res) => controller.findAll(req, res))
  router.get('/:id', (req, res) => controller.findById(req, res))
  router.get('/:id/available-slots', (req, res) => controller.getAvailableSlots(req, res))
  router.post('/', (req, res) => controller.create(req, res))
  router.put('/:id', (req, res) => controller.update(req, res))
  router.delete('/:id', (req, res) => controller.delete(req, res))

  return router
}
