import { Router } from 'express'
import Container from 'typedi'
import { FhirController } from '../fhir/FhirController'

export function createFhirRoutes(): Router {
  const router = Router()
  const controller = Container.get(FhirController)

  router.post('/export/patient/:id', (req, res) => controller.exportPatient(req, res))
  router.post('/export/doctor/:id', (req, res) => controller.exportDoctor(req, res))
  router.get('/import/patient/:fhirId', (req, res) => controller.importPatient(req, res))
  router.get('/search/patients', (req, res) => controller.searchPatients(req, res))
  router.get('/search/practitioners', (req, res) => controller.searchPractitioners(req, res))

  return router
}
