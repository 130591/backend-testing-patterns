import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { ExamRequestStatus } from '../enums'
import { ExamItem } from '../types/exam'
import { MedicalRecord } from './MedicalRecord'
import { Doctor } from './Doctor'
import { Patient } from './Patient'

@Entity()
export class ExamRequest {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  medicalRecordId!: number

  @Column()
  doctorId!: number

  @Column()
  patientId!: number

  @Column({ type: 'jsonb' })
  exams!: ExamItem[]

  @Column({ type: 'enum', enum: ExamRequestStatus, default: ExamRequestStatus.REQUESTED })
  status!: ExamRequestStatus

  @Column({ type: 'text', nullable: true })
  notes!: string | null

  @Column({ type: 'timestamp' })
  requestedAt!: Date

  @ManyToOne(() => MedicalRecord, (r) => r.examRequests)
  @JoinColumn({ name: 'medicalRecordId' })
  medicalRecord!: MedicalRecord

  @ManyToOne(() => Doctor, (d) => d.examRequests)
  @JoinColumn({ name: 'doctorId' })
  doctor!: Doctor

  @ManyToOne(() => Patient, (p) => p.examRequests)
  @JoinColumn({ name: 'patientId' })
  patient!: Patient
}
