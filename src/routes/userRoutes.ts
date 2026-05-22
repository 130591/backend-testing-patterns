import { Router } from 'express'
import Container from 'typedi'
import { UserController } from '../controllers/UserController'

export function createUserRoutes(): Router {
  const router = Router()
  const controller = Container.get(UserController)

  router.get('/', (req, res) => controller.findAll(req, res))
  router.get('/:id', (req, res) => controller.findById(req, res))
  router.post('/', (req, res) => controller.create(req, res))
  router.put('/:id', (req, res) => controller.update(req, res))
  router.delete('/:id', (req, res) => controller.delete(req, res))

  return router
}
