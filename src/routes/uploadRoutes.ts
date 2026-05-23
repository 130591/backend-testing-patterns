import { Router } from 'express'
import multer from 'multer'
import * as path from 'path'
import * as crypto from 'crypto'
import Container from 'typedi'
import { UploadController } from '../uploads/UploadController'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

export function createUploadRoutes(): Router {
  const router = Router()
  const controller = Container.get(UploadController)

  router.post('/', upload.single('file'), (req, res) => controller.upload(req, res))
  router.get('/medical-record/:medicalRecordId', (req, res) => controller.findByMedicalRecord(req, res))
  router.get('/patient/:patientId', (req, res) => controller.findByPatient(req, res))
  router.get('/:id/download', (req, res) => controller.download(req, res))
  router.delete('/:id', (req, res) => controller.delete(req, res))

  return router
}
