import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { MedicalRecord } from './MedicalRecord'
import { Patient } from './Patient'

@Entity()
export class Attachment {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  medicalRecordId!: number

  @Column()
  patientId!: number

  @Column()
  originalName!: string

  @Column()
  storedName!: string

  @Column()
  mimeType!: string

  @Column({ type: 'int' })
  size!: number

  @Column({ nullable: true })
  description!: string | null

  @CreateDateColumn()
  createdAt!: Date

  @ManyToOne(() => MedicalRecord)
  @JoinColumn({ name: 'medicalRecordId' })
  medicalRecord!: MedicalRecord

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patientId' })
  patient!: Patient
}
