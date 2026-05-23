import { Router } from 'express'
import Container from 'typedi'
import { NotificationController } from '../notifications/NotificationController'

export function createNotificationRoutes(): Router {
  const router = Router()
  const controller = Container.get(NotificationController)

  router.post('/reminders/send', (req, res) => controller.sendReminders(req, res))
  router.post('/appointment/:appointmentId/notify', (req, res) => controller.notifyScheduled(req, res))

  return router
}
