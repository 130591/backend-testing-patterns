import { Service } from 'typedi'
import * as path from 'path'
import * as fs from 'fs'
import { AttachmentRepository } from '../repositories/AttachmentRepository'
import { MedicalRecordRepository } from '../repositories/MedicalRecordRepository'
import { Attachment } from '../entities/Attachment'
import { AuditLogService } from '../services/AuditLogService'
import { AppError } from '../errors/AppError'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif',
  'application/pdf',
  'application/dicom',
]

@Service()
export class UploadService {
  constructor(
    private readonly attachmentRepository: AttachmentRepository,
    private readonly medicalRecordRepository: MedicalRecordRepository,
    private readonly auditLogService: AuditLogService,
  ) {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    }
  }

  async upload(
    file: Express.Multer.File,
    medicalRecordId: number,
    description?: string,
  ): Promise<Attachment> {
    const record = await this.medicalRecordRepository.findById(medicalRecordId)
    if (!record) {
      throw new AppError('Medical record not found', 404)
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError(`File type ${file.mimetype} not allowed`, 400)
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new AppError(`File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`, 400)
    }

    const attachment = await this.attachmentRepository.create({
      medicalRecordId,
      patientId: record.patientId,
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      description: description || null,
    })

    await this.auditLogService.log({
      action: 'UPLOAD',
      entity: 'Attachment',
      entityId: attachment.id,
      newValue: {
        originalName: file.originalname,
        medicalRecordId,
        size: file.size,
      },
    })

    return attachment
  }

  async findByMedicalRecordId(medicalRecordId: number): Promise<Attachment[]> {
    return this.attachmentRepository.findByMedicalRecordId(medicalRecordId)
  }

  async findByPatientId(patientId: number): Promise<Attachment[]> {
    return this.attachmentRepository.findByPatientId(patientId)
  }

  async getFilePath(id: number): Promise<{ attachment: Attachment; filePath: string }> {
    const attachment = await this.attachmentRepository.findById(id)
    if (!attachment) {
      throw new AppError('Attachment not found', 404)
    }

    const filePath = path.join(UPLOAD_DIR, attachment.storedName)
    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found on disk', 404)
    }

    return { attachment, filePath }
  }

  async delete(id: number): Promise<void> {
    const attachment = await this.attachmentRepository.findById(id)
    if (!attachment) {
      throw new AppError('Attachment not found', 404)
    }

    const filePath = path.join(UPLOAD_DIR, attachment.storedName)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    await this.attachmentRepository.delete(id)

    await this.auditLogService.log({
      action: 'DELETE',
      entity: 'Attachment',
      entityId: id,
    })
  }

  getUploadDir(): string {
    return UPLOAD_DIR
  }
}
