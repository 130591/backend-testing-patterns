import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, OneToMany, JoinColumn } from 'typeorm'
import { Patient } from './Patient'
import { Doctor } from './Doctor'
import { Appointment } from './Appointment'
import { Prescription } from './Prescription'
import { ExamRequest } from './ExamRequest'

@Entity()
export class MedicalRecord {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  patientId!: number

  @Column()
  doctorId!: number

  @Column({ type: 'int', nullable: true })
  appointmentId!: number | null

  @Column({ type: 'text', nullable: true })
  chiefComplaint!: string | null

  @Column({ type: 'text', nullable: true })
  historyOfPresentIllness!: string | null

  @Column({ type: 'text', nullable: true })
  physicalExamination!: string | null

  @Column('text', { array: true, default: '{}' })
  diagnosis!: string[]

  @Column({ type: 'text', nullable: true })
  notes!: string | null

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @ManyToOne(() => Patient, (p) => p.medicalRecords)
  @JoinColumn({ name: 'patientId' })
  patient!: Patient

  @ManyToOne(() => Doctor, (d) => d.medicalRecords)
  @JoinColumn({ name: 'doctorId' })
  doctor!: Doctor

  @OneToOne(() => Appointment, (a) => a.medicalRecord)
  @JoinColumn({ name: 'appointmentId' })
  appointment!: Appointment

  @OneToMany(() => Prescription, (p) => p.medicalRecord)
  prescriptions!: Prescription[]

  @OneToMany(() => ExamRequest, (e) => e.medicalRecord)
  examRequests!: ExamRequest[]
}
