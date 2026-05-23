import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Gender } from '../enums'
import { Appointment } from './Appointment'
import { MedicalRecord } from './MedicalRecord'
import { Prescription } from './Prescription'
import { ExamRequest } from './ExamRequest'
import { PatientInsurance } from './PatientInsurance'

@Entity()
export class Patient {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column({ unique: true })
  cpf!: string

  @Column()
  email!: string

  @Column()
  phone!: string

  @Column({ type: 'date' })
  dateOfBirth!: string

  @Column({ type: 'enum', enum: Gender })
  gender!: Gender

  @Column({ type: 'text', nullable: true })
  address!: string | null

  @Column({ type: 'text', nullable: true })
  emergencyContact!: string | null

  @Column({ type: 'text', nullable: true })
  bloodType!: string | null

  @Column('text', { array: true, default: '{}' })
  allergies!: string[]

  @Column('text', { array: true, default: '{}' })
  chronicConditions!: string[]

  @Column({ default: true })
  active!: boolean

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @OneToMany(() => Appointment, (a) => a.patient)
  appointments!: Appointment[]

  @OneToMany(() => MedicalRecord, (r) => r.patient)
  medicalRecords!: MedicalRecord[]

  @OneToMany(() => Prescription, (p) => p.patient)
  prescriptions!: Prescription[]

  @OneToMany(() => ExamRequest, (e) => e.patient)
  examRequests!: ExamRequest[]

  @OneToMany(() => PatientInsurance, (pi) => pi.patient)
  insurances!: PatientInsurance[]
}
