import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Patient } from './Patient'
import { InsurancePlan } from './InsurancePlan'

@Entity()
export class PatientInsurance {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  patientId!: number

  @Column()
  insurancePlanId!: number

  @Column()
  cardNumber!: string

  @Column({ type: 'date', nullable: true })
  validUntil!: string | null

  @ManyToOne(() => Patient, (p) => p.insurances)
  @JoinColumn({ name: 'patientId' })
  patient!: Patient

  @ManyToOne(() => InsurancePlan, (ip) => ip.patientInsurances)
  @JoinColumn({ name: 'insurancePlanId' })
  insurancePlan!: InsurancePlan
}
