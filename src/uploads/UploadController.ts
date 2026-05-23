import { Service } from 'typedi'
import { Request, Response } from 'express'
import { UploadService } from './UploadService'

@Service()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  async upload(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' })
      return
    }

    const medicalRecordId = Number(req.body.medicalRecordId)
    const description = req.body.description

    const attachment = await this.uploadService.upload(req.file, medicalRecordId, description)
    res.status(201).json(attachment)
  }

  async findByMedicalRecord(req: Request, res: Response): Promise<void> {
    const attachments = await this.uploadService.findByMedicalRecordId(Number(req.params.medicalRecordId))
    res.json(attachments)
  }

  async findByPatient(req: Request, res: Response): Promise<void> {
    const attachments = await this.uploadService.findByPatientId(Number(req.params.patientId))
    res.json(attachments)
  }

  async download(req: Request, res: Response): Promise<void> {
    const { attachment, filePath } = await this.uploadService.getFilePath(Number(req.params.id))
    res.setHeader('Content-Type', attachment.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`)
    res.sendFile(filePath)
  }

  async delete(req: Request, res: Response): Promise<void> {
    await this.uploadService.delete(Number(req.params.id))
    res.status(204).send()
  }
}
