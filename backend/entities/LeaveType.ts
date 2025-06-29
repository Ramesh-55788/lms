import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { LeaveRequest } from './LeaveRequest';
import { LeaveBalance } from './LeaveBalance';

@Entity('leave_types')
export class LeaveType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ name: 'max_per_year' })
  maxPerYear!: number;

  @Column({ name: 'multi_approver', default: 1 })
  multiApprover!: number;

  @Column({ name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @OneToMany(() => LeaveRequest, (lr) => lr.leaveType)
  leaveRequests!: LeaveRequest[];

  @OneToMany(() => LeaveBalance, (lb) => lb.leaveType)
  leaveBalances!: LeaveBalance[];
}
