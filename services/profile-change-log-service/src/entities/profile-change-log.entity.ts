import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('profile_change_logs')
@Index('idx_profile_log_employee_id', ['employeeId'])
export class ProfileChangeLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'employee_id' })
  employeeId: string;

  @Column('varchar', { length: 50, name: 'changed_field' })
  changedField: string;

  @Column('text', { nullable: true, name: 'old_value' })
  oldValue: string;

  @Column('text', { nullable: true, name: 'new_value' })
  newValue: string;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}
