import 'reflect-metadata'
import { AppDataSource } from '../../config/data-source'
import { Doctor } from '../../entities/Doctor'
import { Patient } from '../../entities/Patient'

export async function setupDatabase(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }
}

export async function truncateDatabase(): Promise<void> {
  const entities = AppDataSource.entityMetadatas
  const tables = entities.map((e) => `"${e.tableName}"`).join(', ')
  await AppDataSource.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`)
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy()
  }
}
