import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('employees')
@Index('idx_employees_email', ['email'])
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100 })
  name: string;

  @Column('varchar', { length: 100, unique: true })
  email: string;

  @Column('text', { name: 'password_hash' })
  @Exclude()
  passwordHash: string;

  @Column('text', { nullable: true, name: 'photo_url' })
  photoUrl: string;

  @Column('varchar', { length: 100, nullable: true })
  position: string;

  @Column('varchar', { length: 20, nullable: true, name: 'phone_number' })
  phoneNumber: string;

  @Column('varchar', { length: 50, default: 'employee' })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
