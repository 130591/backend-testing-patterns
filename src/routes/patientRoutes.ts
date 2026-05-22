import { Router } from 'express'
import Container from 'typedi'
import { PatientController } from '../controllers/PatientController'

export function createPatientRoutes(): Router {
  const router = Router()
  const controller = Container.get(PatientController)

  router.get('/search', (req, res) => controller.searchByName(req, res))
  router.get('/cpf/:cpf', (req, res) => controller.searchByCpf(req, res))
  router.get('/', (req, res) => controller.findAll(req, res))
  router.get('/:id', (req, res) => controller.findById(req, res))
  router.post('/', (req, res) => controller.create(req, res))
  router.put('/:id', (req, res) => controller.update(req, res))
  router.delete('/:id', (req, res) => controller.delete(req, res))

  router.get('/:id/insurance', (req, res) => controller.getInsurances(req, res))
  router.post('/:id/insurance', (req, res) => controller.addInsurance(req, res))
  router.delete('/:id/insurance/:insuranceId', (req, res) => controller.removeInsurance(req, res))

  return router
}
