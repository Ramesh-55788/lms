import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserRole } from '../enums/UserRole';
import { LeaveRequest } from './LeaveRequest';
import { LeaveBalance } from './LeaveBalance';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @Column({ name: 'manager_id', nullable: true })
  managerId!: number | null;

  @ManyToOne(() => User, (user) => user.directReports, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'manager_id' })
  manager!: User | null;

  @OneToMany(() => User, (user) => user.manager)
  directReports!: User[];

  @OneToMany(() => LeaveRequest, (lr) => lr.user)
  leaveRequests!: LeaveRequest[];

  @OneToMany(() => LeaveBalance, (lb) => lb.user)
  leaveBalances!: LeaveBalance[];
}
