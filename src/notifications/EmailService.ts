import { Service } from 'typedi'
import * as nodemailer from 'nodemailer'

@Service()
export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    })
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@medicalapp.com',
      to,
      subject,
      html,
    })
  }

  async sendAppointmentReminder(
    patientEmail: string,
    patientName: string,
    doctorName: string,
    dateTime: Date,
  ): Promise<void> {
    const formattedDate = dateTime.toLocaleDateString('pt-BR')
    const formattedTime = dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    await this.sendEmail(
      patientEmail,
      'Lembrete de Consulta',
      `
        <h2>Lembrete de Consulta</h2>
        <p>Olá ${patientName},</p>
        <p>Sua consulta com <strong>Dr(a). ${doctorName}</strong> está agendada para:</p>
        <p><strong>Data:</strong> ${formattedDate}<br/>
        <strong>Horário:</strong> ${formattedTime}</p>
        <p>Em caso de cancelamento, entre em contato com pelo menos 24 horas de antecedência.</p>
      `,
    )
  }

  async sendAppointmentConfirmation(
    patientEmail: string,
    patientName: string,
    doctorName: string,
    dateTime: Date,
  ): Promise<void> {
    const formattedDate = dateTime.toLocaleDateString('pt-BR')
    const formattedTime = dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    await this.sendEmail(
      patientEmail,
      'Consulta Agendada com Sucesso',
      `
        <h2>Consulta Confirmada</h2>
        <p>Olá ${patientName},</p>
        <p>Sua consulta foi agendada com sucesso!</p>
        <p><strong>Médico:</strong> Dr(a). ${doctorName}<br/>
        <strong>Data:</strong> ${formattedDate}<br/>
        <strong>Horário:</strong> ${formattedTime}</p>
      `,
    )
  }

  async sendCancellationNotice(
    patientEmail: string,
    patientName: string,
    doctorName: string,
    dateTime: Date,
    fee: number,
  ): Promise<void> {
    const formattedDate = dateTime.toLocaleDateString('pt-BR')
    const feeText = fee > 0
      ? `<p><strong>Atenção:</strong> Uma taxa de ${fee * 100}% será aplicada por cancelamento com menos de 24h.</p>`
      : ''

    await this.sendEmail(
      patientEmail,
      'Consulta Cancelada',
      `
        <h2>Consulta Cancelada</h2>
        <p>Olá ${patientName},</p>
        <p>Sua consulta com Dr(a). ${doctorName} em ${formattedDate} foi cancelada.</p>
        ${feeText}
      `,
    )
  }
}
