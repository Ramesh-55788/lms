import { AppDataSource } from '../config/db';
import { LeaveRequest } from '../entities/LeaveRequest';
import { LeaveStatus } from '../enums/LeaveStatus';
import { HalfDayType } from '../enums/HalfDayType';

const leaveRequestRepo = AppDataSource.getRepository(LeaveRequest);

export const getUsersOnLeaveToday = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await leaveRequestRepo
    .createQueryBuilder('lr')
    .select([
      'u.id AS userId',
      'u.name AS userName',
      'u.email AS userEmail',
      'lr.startDate AS leaveStartDate',
      'lr.endDate AS leaveEndDate',
      'lt.name AS leaveTypeName',
    ])
    .innerJoin('lr.user', 'u')
    .innerJoin('lr.leaveType', 'lt')
    .where('lr.status = :status', { status: LeaveStatus.APPROVED })
    .andWhere(':today BETWEEN lr.startDate AND lr.endDate', { today })
    .andWhere('lr.isDeleted = false')
    .andWhere('u.isDeleted = false')
    .andWhere('lt.isDeleted = false')
    .getRawMany();

  return result.map((row: any) => ({
    id: row.userId,
    name: row.userName,
    email: row.userEmail,
    startDate: row.leaveStartDate,
    endDate: row.leaveEndDate,
    leaveType: row.leaveTypeName,
  }));
};

export const getTeamLeave = async (
  userIds: number[],
  month: number,
  year: number,
  role: string
) => {
  const query = leaveRequestRepo
    .createQueryBuilder('lr')
    .leftJoin('lr.leaveType', 'lt')
    .select([
      'lr.id',
      'lr.userId',
      'lr.leaveTypeId',
      'lr.startDate',
      'lr.endDate',
      'lr.reason',
      'lr.status',
      'lt.name AS leaveTypeName',
    ])
    .where('MONTH(lr.startDate) = :month', { month })
    .andWhere('YEAR(lr.startDate) = :year', { year })
    .andWhere('lr.status = :status', { status: LeaveStatus.APPROVED })
    .andWhere('lr.isDeleted = false')
    .andWhere('lt.isDeleted = false');

  if (role !== 'admin') {
    query.andWhere('lr.userId IN (:...userIds)', { userIds });
  }

  return await query.getRawMany();
};

export const getLeaveHistoryByUserId = async (userId: number) => {
  const leaveRequests = await leaveRequestRepo
    .createQueryBuilder('lr')
    .leftJoinAndSelect('lr.leaveType', 'lt')
    .leftJoinAndSelect('lr.user', 'u')
    .leftJoinAndSelect('u.manager', 'mgr')
    .where('lr.userId = :userId', { userId })
    .andWhere('lr.isDeleted = false')
    .andWhere('lt.isDeleted = false')
    .andWhere('u.isDeleted = false')
    .orderBy('lr.createdAt', 'DESC')
    .getMany();

  return leaveRequests.map((request) => ({
    id: request.id,
    leave_type: request.leaveType.name,
    start_date: request.startDate,
    end_date: request.endDate,
    reason: request.reason,
    status: request.status,
    manager_name: request.user.manager?.name || null,
    total_days: request.totalDays,
    created_at: request.createdAt,
    updated_at: request.statusUpdatedAt,
  }));
};

export const findLeaveOverlappingDates = async (
  userId: number,
  startDate: string,
  endDate: string
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return await leaveRequestRepo
    .createQueryBuilder('lr')
    .where('lr.userId = :userId', { userId })
    .andWhere('lr.status IN (:...statuses)', {
      statuses: [
        LeaveStatus.PENDING,
        LeaveStatus.PENDING_L1,
        LeaveStatus.PENDING_L2,
        LeaveStatus.APPROVED,
      ],
    })
    .andWhere('DATE(lr.startDate) <= DATE(:end)', { end })
    .andWhere('DATE(lr.endDate) >= DATE(:start)', { start })
    .andWhere('lr.isDeleted = false')
    .getMany();
};

export const createLeaveRequest = async (
  userId: number,
  leaveTypeId: number,
  startDate: string,
  endDate: string,
  isHalfDay: boolean,
  halfDayType: HalfDayType | null,
  reason: string,
  status: LeaveStatus,
  finalApprovalLevel: number,
  totalDays: number,
  level2ApproverId: number | null = null,
  level3ApproverId: number | null = null
) => {
  const leaveRequest = leaveRequestRepo.create({
    user: { id: userId },
    leaveType: { id: leaveTypeId },
    startDate,
    endDate,
    isHalfDay,
    halfDayType,
    reason,
    status,
    finalApprovalLevel,
    totalDays,
    level2ApproverId,
    level3ApproverId,
  });

  const savedRequest = await leaveRequestRepo.save(leaveRequest);
  return { insertId: savedRequest.id };
};

export const getLeaveRequestById = async (id: number) => {
  return leaveRequestRepo
    .createQueryBuilder('lr')
    .leftJoinAndSelect('lr.user', 'u')
    .leftJoinAndSelect('lr.leaveType', 'lt')
    .where('lr.id = :id', { id })
    .andWhere('lr.isDeleted = false')
    .andWhere('u.isDeleted = false')
    .andWhere('lt.isDeleted = false')
    .getOne();
};

export const updateLeaveRequestStatus = async (id: number, status: LeaveStatus) => {
  const leaveRequest = await leaveRequestRepo.findOne({
    where: { id, isDeleted: false },
  });
  if (!leaveRequest) return null;
  leaveRequest.status = status;
  leaveRequest.statusUpdatedAt = new Date();
  return leaveRequestRepo.save(leaveRequest);
};

export const getIncomingRequests = async (userId: number, userRole: string) => {
  let query = leaveRequestRepo
    .createQueryBuilder('lr')
    .leftJoinAndSelect('lr.user', 'u')
    .leftJoinAndSelect('lr.leaveType', 'lt')
    .leftJoinAndSelect('u.manager', 'mgr')
    .where('lr.isDeleted = false')
    .andWhere('u.isDeleted = false')
    .andWhere('lt.isDeleted = false');

  if (userRole === 'admin') {
    query = query
      .leftJoinAndSelect('mgr.manager', 'hr')
      .andWhere('(lr.status = :pending AND u.role = :hrRole)', {
        pending: LeaveStatus.PENDING,
        hrRole: 'hr',
      })
      .orWhere('(lr.status = :pendingL3 AND hr.managerId = :userId)', {
        pendingL3: LeaveStatus.PENDING_L3,
        userId,
      })
      .orWhere('(lr.status = :pendingL2 AND mgr.managerId = :userId)', {
        pendingL2: LeaveStatus.PENDING_L2,
        userId,
      });
  } else if (userRole === 'hr') {
    query = query
      .andWhere('(lr.status = :pending AND u.managerId = :userId)', {
        pending: LeaveStatus.PENDING,
        userId,
      })
      .orWhere('(lr.status = :pendingL1 AND u.managerId = :userId)', {
        pendingL1: LeaveStatus.PENDING_L1,
        userId,
      })
      .orWhere('(lr.status = :pendingL2 AND mgr.managerId = :userId)', {
        pendingL2: LeaveStatus.PENDING_L2,
        userId,
      });
  } else if (userRole === 'manager') {
    query = query
      .andWhere('(lr.status = :pending AND u.managerId = :userId)', {
        pending: LeaveStatus.PENDING,
        userId,
      })
      .orWhere('(lr.status = :pendingL1 AND u.managerId = :userId)', {
        pendingL1: LeaveStatus.PENDING_L1,
        userId,
      });
  }

  const results = await query.getMany();

  return results.map((request) => ({
    ...request,
    employee_name: request.user.name,
    leave_type: request.leaveType.name,
    start_date: request.startDate,
    end_date: request.endDate,
  }));
};
