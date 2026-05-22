import 'reflect-metadata'
import Container from 'typedi'
import { AppDataSource } from './config/data-source'
import { createApp } from './app'

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize()
  console.log('Database connected')

  // Register the DataSource in the TypeDI container
  Container.set('DataSource', AppDataSource)

  const app = createApp()
  const port = process.env.PORT || 3000

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
  })
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
