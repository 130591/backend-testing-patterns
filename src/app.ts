import express from 'express'
import { createUserRoutes } from './routes/userRoutes'
import { createPatientRoutes } from './routes/patientRoutes'
import { createDoctorRoutes } from './routes/doctorRoutes'
import { createAppointmentRoutes } from './routes/appointmentRoutes'
import { createMedicalRecordRoutes } from './routes/medicalRecordRoutes'
import { createPrescriptionRoutes } from './routes/prescriptionRoutes'
import { createExamRequestRoutes } from './routes/examRequestRoutes'
import { createInsurancePlanRoutes } from './routes/insurancePlanRoutes'
import { errorHandler } from './middlewares/errorHandler'

export function createApp(): express.Application {
  const app = express()

  app.use(express.json())

  app.use('/users', createUserRoutes())
  app.use('/patients', createPatientRoutes())
  app.use('/doctors', createDoctorRoutes())
  app.use('/appointments', createAppointmentRoutes())
  app.use('/medical-records', createMedicalRecordRoutes())
  app.use('/prescriptions', createPrescriptionRoutes())
  app.use('/exam-requests', createExamRequestRoutes())
  app.use('/insurance-plans', createInsurancePlanRoutes())

  app.use(errorHandler)

  return app
}
