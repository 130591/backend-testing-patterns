import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Role } from '../enums/Role'

@Entity()
export class UserAccount {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ unique: true })
  email!: string

  @Column()
  password!: string

  @Column({ type: 'enum', enum: Role })
  role!: Role

  @Column({ nullable: true })
  referenceId!: number | null

  @Column({ default: false })
  twoFactorEnabled!: boolean

  @Column({ nullable: true })
  twoFactorSecret!: string | null

  @Column({ default: true })
  active!: boolean

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
