import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { PatientInsurance } from './PatientInsurance'

@Entity()
export class InsurancePlan {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column({ unique: true })
  code!: string

  @Column({ default: true })
  active!: boolean

  @OneToMany(() => PatientInsurance, (pi) => pi.insurancePlan)
  patientInsurances!: PatientInsurance[]
}
