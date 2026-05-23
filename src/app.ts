import express from 'express'
import { createUserRoutes } from './routes/userRoutes'
import { createPatientRoutes } from './routes/patientRoutes'
import { createDoctorRoutes } from './routes/doctorRoutes'
import { createAppointmentRoutes } from './routes/appointmentRoutes'
import { createMedicalRecordRoutes } from './routes/medicalRecordRoutes'
import { createPrescriptionRoutes } from './routes/prescriptionRoutes'
import { createExamRequestRoutes } from './routes/examRequestRoutes'
import { createInsurancePlanRoutes } from './routes/insurancePlanRoutes'
import { createAuthRoutes } from './routes/authRoutes'
import { createFhirRoutes } from './routes/fhirRoutes'
import { createAnalyticsRoutes } from './routes/analyticsRoutes'
import { createNotificationRoutes } from './routes/notificationRoutes'
import { createUploadRoutes } from './routes/uploadRoutes'
import { errorHandler } from './middlewares/errorHandler'

export function createApp(): express.Application {
  const app = express()

  app.use(express.json())

  // Auth
  app.use('/auth', createAuthRoutes())

  // Domain
  app.use('/users', createUserRoutes())
  app.use('/patients', createPatientRoutes())
  app.use('/doctors', createDoctorRoutes())
  app.use('/appointments', createAppointmentRoutes())
  app.use('/medical-records', createMedicalRecordRoutes())
  app.use('/prescriptions', createPrescriptionRoutes())
  app.use('/exam-requests', createExamRequestRoutes())
  app.use('/insurance-plans', createInsurancePlanRoutes())

  // Integrations
  app.use('/fhir', createFhirRoutes())
  app.use('/notifications', createNotificationRoutes())
  app.use('/attachments', createUploadRoutes())

  // Analytics
  app.use('/analytics', createAnalyticsRoutes())

  app.use(errorHandler)

  return app
}
