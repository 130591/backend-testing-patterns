import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Appointment } from './Appointment'
import { MedicalRecord } from './MedicalRecord'
import { Prescription } from './Prescription'
import { ExamRequest } from './ExamRequest'

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column({ unique: true })
  crm!: string

  @Column()
  email!: string

  @Column()
  phone!: string

  @Column()
  specialty!: string

  @Column('text', { array: true, default: '{}' })
  availableDays!: string[]

  @Column({ type: 'int' })
  consultationDuration!: number

  @Column({ default: true })
  active!: boolean

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @OneToMany(() => Appointment, (a) => a.doctor)
  appointments!: Appointment[]

  @OneToMany(() => MedicalRecord, (r) => r.doctor)
  medicalRecords!: MedicalRecord[]

  @OneToMany(() => Prescription, (p) => p.doctor)
  prescriptions!: Prescription[]

  @OneToMany(() => ExamRequest, (e) => e.doctor)
  examRequests!: ExamRequest[]
}
