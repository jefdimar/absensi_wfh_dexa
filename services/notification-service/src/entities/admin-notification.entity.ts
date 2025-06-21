import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('admin_notifications')
@Index('idx_notifications_employee_id', ['employeeId'])
@Index('idx_notifications_read', ['read'])
export class AdminNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'employee_id' })
  employeeId: string;

  @Column('text')
  message: string;

  @Column('boolean', { default: false })
  read: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}