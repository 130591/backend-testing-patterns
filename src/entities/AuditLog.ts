import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'int', nullable: true })
  userId!: number | null

  @Column()
  action!: string

  @Column()
  entity!: string

  @Column({ type: 'int', nullable: true })
  entityId!: number | null

  @Column({ type: 'jsonb', nullable: true })
  oldValue!: Record<string, unknown> | null

  @Column({ type: 'jsonb', nullable: true })
  newValue!: Record<string, unknown> | null

  @Column({ type: 'text', nullable: true })
  ipAddress!: string | null

  @CreateDateColumn()
  createdAt!: Date
}
