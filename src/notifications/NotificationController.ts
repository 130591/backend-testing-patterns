import { Service } from 'typedi'
import { Request, Response } from 'express'
import { NotificationService } from './NotificationService'

@Service()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  async sendReminders(_req: Request, res: Response): Promise<void> {
    const result = await this.notificationService.sendPendingReminders()
    res.json(result)
  }

  async notifyScheduled(req: Request, res: Response): Promise<void> {
    await this.notificationService.notifyAppointmentScheduled(Number(req.params.appointmentId))
    res.json({ message: 'Notification sent' })
  }
}
