import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm'
import { AppointmentStatus, AppointmentType } from '../enums'
import { Patient } from './Patient'
import { Doctor } from './Doctor'
import { MedicalRecord } from './MedicalRecord'

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  patientId!: number

  @Column()
  doctorId!: number

  @Column({ type: 'timestamp' })
  dateTime!: Date

  @Column({ type: 'timestamp' })
  endTime!: Date

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  status!: AppointmentStatus

  @Column({ type: 'enum', enum: AppointmentType })
  type!: AppointmentType

  @Column({ type: 'text', nullable: true })
  notes!: string | null

  @Column({ nullable: true })
  cancellationReason!: string | null

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt!: Date | null

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @ManyToOne(() => Patient, (p) => p.appointments)
  @JoinColumn({ name: 'patientId' })
  patient!: Patient

  @ManyToOne(() => Doctor, (d) => d.appointments)
  @JoinColumn({ name: 'doctorId' })
  doctor!: Doctor

  @OneToOne(() => MedicalRecord, (r) => r.appointment)
  medicalRecord!: MedicalRecord
}
