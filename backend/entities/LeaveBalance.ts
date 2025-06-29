import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { LeaveType } from './LeaveType';

@Entity('leave_balances')
export class LeaveBalance {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'leave_type_id' })
  leaveTypeId!: number;

  @Column()
  year!: number;

  @Column({ type: 'float' })
  balance!: number;

  @Column({ type: 'float' })
  used!: number;

  @Column({ name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @ManyToOne(() => User, (user) => user.leaveBalances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => LeaveType, (lt) => lt.leaveBalances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'leave_type_id' })
  leaveType!: LeaveType;
}
