import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { LeaveType } from './LeaveType';
import { LeaveStatus } from '../enums/LeaveStatus';
import { HalfDayType } from '../enums/HalfDayType';

@Entity('leave_requests')
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'leave_type_id' })
  leaveTypeId!: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  @Column({ name: 'is_half_day', default: false })
  isHalfDay!: boolean;

  @Column({
    name: 'half_day_type',
    type: 'enum',
    enum: HalfDayType,
    nullable: true,
  })
  halfDayType?: HalfDayType | null;

  @Column({ nullable: true })
  reason!: string;

  @Column({
    type: 'enum',
    enum: LeaveStatus,
    default: LeaveStatus.PENDING,
  })
  status!: LeaveStatus;

  @Column({ name: 'final_approval_level', default: 1 })
  finalApprovalLevel!: number;

  @Column({ name: 'total_days', type: 'decimal', precision: 4, scale: 2 })
  totalDays!: number;

  @Column({ name: 'level2_approver_id', type: 'int', nullable: true })
  level2ApproverId?: number | null;

  @Column({ name: 'level3_approver_id', type: 'int', nullable: true })
  level3ApproverId?: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'status_updated_at', type: 'timestamp', nullable: true })
  statusUpdatedAt!: Date;

  @Column({ name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @ManyToOne(() => User, (user) => user.leaveRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => LeaveType, (lt) => lt.leaveRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'leave_type_id' })
  leaveType!: LeaveType;
}
