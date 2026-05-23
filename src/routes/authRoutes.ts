import { Router } from 'express'
import Container from 'typedi'
import { AuthController } from '../auth/AuthController'
import { authenticate } from '../auth/authMiddleware'

export function createAuthRoutes(): Router {
  const router = Router()
  const controller = Container.get(AuthController)

  router.post('/register', (req, res) => controller.register(req, res))
  router.post('/login', (req, res) => controller.login(req, res))
  router.get('/me', authenticate, (req, res) => controller.me(req, res))
  router.post('/2fa/enable', authenticate, (req, res) => controller.enable2FA(req, res))
  router.post('/2fa/confirm', authenticate, (req, res) => controller.confirm2FA(req, res))

  return router
}
