import express from 'express'
import { createUserRoutes } from './routes/userRoutes'

export function createApp(): express.Application {
  const app = express()

  app.use(express.json())
  app.use('/users', createUserRoutes())

  return app
}
