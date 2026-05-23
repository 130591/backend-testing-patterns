import { Service } from 'typedi'
import twilio from 'twilio'

@Service()
export class SmsService {
  private client: twilio.Twilio | null = null

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken)
    }
  }

  async sendSms(to: string, body: string): Promise<void> {
    if (!this.client) {
      console.log(`[SMS MOCK] To: ${to} | Body: ${body}`)
      return
    }

    await this.client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER || '',
      to,
    })
  }

  async sendAppointmentReminder(
    phone: string,
    patientName: string,
    doctorName: string,
    dateTime: Date,
  ): Promise<void> {
    const formattedDate = dateTime.toLocaleDateString('pt-BR')
    const formattedTime = dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    await this.sendSms(
      phone,
      `Olá ${patientName}, lembrete: sua consulta com Dr(a). ${doctorName} é em ${formattedDate} às ${formattedTime}. Para cancelar, entre em contato com 24h de antecedência.`,
    )
  }

  async sendAppointmentConfirmation(
    phone: string,
    patientName: string,
    doctorName: string,
    dateTime: Date,
  ): Promise<void> {
    const formattedDate = dateTime.toLocaleDateString('pt-BR')
    const formattedTime = dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    await this.sendSms(
      phone,
      `Consulta confirmada! Dr(a). ${doctorName} em ${formattedDate} às ${formattedTime}. Obrigado, ${patientName}!`,
    )
  }
}
