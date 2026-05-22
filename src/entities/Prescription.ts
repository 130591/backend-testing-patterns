import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Medication } from '../types/medication'
import { MedicalRecord } from './MedicalRecord'
import { Doctor } from './Doctor'
import { Patient } from './Patient'

@Entity()
export class Prescription {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  medicalRecordId!: number

  @Column()
  doctorId!: number

  @Column()
  patientId!: number

  @Column({ type: 'jsonb' })
  medications!: Medication[]

  @Column({ type: 'text', nullable: true })
  notes!: string | null

  @Column({ type: 'timestamp' })
  issuedAt!: Date

  @Column({ type: 'timestamp', nullable: true })
  validUntil!: Date | null

  @ManyToOne(() => MedicalRecord, (r) => r.prescriptions)
  @JoinColumn({ name: 'medicalRecordId' })
  medicalRecord!: MedicalRecord

  @ManyToOne(() => Doctor, (d) => d.prescriptions)
  @JoinColumn({ name: 'doctorId' })
  doctor!: Doctor

  @ManyToOne(() => Patient, (p) => p.prescriptions)
  @JoinColumn({ name: 'patientId' })
  patient!: Patient
}
