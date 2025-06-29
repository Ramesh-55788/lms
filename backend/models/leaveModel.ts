import { LeaveStatus } from '../enums/LeaveStatus';
import { HalfDayType } from '../enums/HalfDayType';
import * as LeaveTypeRepo from '../repositories/LeaveTypeRepository';
import * as LeaveRequestRepo from '../repositories/LeaveRequestRepository';
import * as LeaveBalanceRepo from '../repositories/LeaveBalanceRepository';
import * as UserRepo from '../repositories/UserRepository';

const repositories = {
  leaveType: LeaveTypeRepo,
  leaveRequest: LeaveRequestRepo,
  leaveBalance: LeaveBalanceRepo,
  user: UserRepo
};

const SPECIAL_LEAVE_TYPES = [6, 7];

const helpers = {
  getYear: (date: Date | string): number =>
    date instanceof Date ? date.getFullYear() : new Date(date).getFullYear(),

  isSpecialLeaveType: (leaveTypeId: number): boolean =>
    SPECIAL_LEAVE_TYPES.includes(leaveTypeId),

  validateEntity: async <T>(fetchFn: (id: number) => Promise<T | null>, id: number, notFoundMsg: string): Promise<T> => {
    const entity = await fetchFn(id);
    if (!entity) throw new Error(notFoundMsg);
    return entity;
  },

  getMaxApproverByRole: (role: string): number =>
    ({ employee: 3, manager: 2 }[role] || 1),
  
  getApprovalHierarchy: async (userId: number) => {
    const user = await helpers.validateEntity(repositories.user.getUserById, userId, 'User not found');
  
    const manager = user.manager ? await repositories.user.getUserById(user.manager.id) : null;
    const level2 = manager?.manager ? await repositories.user.getUserById(manager.manager.id) : null;
  
    return {
      user,
      managerId: user.manager?.id ?? null,
      level2ApproverId: manager?.manager?.id ?? null,
      level3ApproverId: level2?.manager?.id ?? null,
    };
  },
    
  updateLeaveBalance: async (
    userId: number,
    leaveTypeId: number,
    year: number,
    balanceChange: number,
    usedChange: number
  ) => {
    await repositories.leaveBalance.updateLeaveBalanceByUserAndType(userId, leaveTypeId, year, balanceChange, usedChange);
  },

  processBalanceUpdate: async (
    userId: number,
    leaveTypeId: number,
    year: number,
    totalDays: number,
    isApproval = true
  ) => {
    const multiplier = isApproval ? 1 : -1;
    const balanceChange = helpers.isSpecialLeaveType(leaveTypeId) ? 0 : -totalDays * multiplier;
    const usedChange = totalDays * multiplier;
    await helpers.updateLeaveBalance(userId, leaveTypeId, year, balanceChange, usedChange);
  }
};

export const getUsersOnLeaveToday = () => repositories.leaveRequest.getUsersOnLeaveToday();

export const getTeamLeave = async (userIdArray: number[], month: number, year: number, role: string) => {
  return repositories.leaveRequest.getTeamLeave(userIdArray, month, year, role);
};

export const getLeaveBalance = (userId: number, year: number) =>
  repositories.leaveBalance.getLeaveBalanceByUserAndYear(userId, year);

export const getLeaveTypes = () => repositories.leaveType.getAllLeaveTypes();

export const getLeaveHistory = (userId: number) =>
  repositories.leaveRequest.getLeaveHistoryByUserId(userId);

export const requestLeave = async (
  userId: number,
  leaveTypeId: number,
  startDate: Date | string,
  endDate: Date | string,
  isHalfDay: boolean,
  halfDayType: HalfDayType,
  reason: string,
  totalDays: number
) => {
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);
  const year = parsedStartDate.getFullYear();

  if (!helpers.isSpecialLeaveType(leaveTypeId)) {
    const balances = await repositories.leaveBalance.getLeaveBalanceByUserAndYear(userId, year);
    const balance = balances.find(b => b.leaveTypeId === leaveTypeId); 
    if (!balance) throw new Error('Leave balance not found');
    if (balance.used + totalDays > balance.balance + balance.used) throw new Error('Leave limit exceeded');
  }

  const overlapping = await repositories.leaveRequest.findLeaveOverlappingDates(userId,parsedStartDate.toISOString(), parsedEndDate.toISOString());
  if (overlapping.length) throw new Error('Leave dates overlap with existing requests');

  const { user } = await helpers.getApprovalHierarchy(userId);
  const leaveType = await helpers.validateEntity(repositories.leaveType.getLeaveTypeById, leaveTypeId, 'Leave type not found');
  const maxApprover = helpers.getMaxApproverByRole(user.role);
  const finalLevel = totalDays >= 5 ? maxApprover : Math.min(leaveType.multiApprover || 1, maxApprover);

  const status = leaveTypeId === 6
    ? LeaveStatus.APPROVED
    : (finalLevel > 1 ? LeaveStatus.PENDING_L1 : LeaveStatus.PENDING);

  return repositories.leaveRequest.createLeaveRequest(
    userId,
    leaveTypeId,
    parsedStartDate.toISOString(),
    parsedEndDate.toISOString(),
    isHalfDay,
    halfDayType,
    reason,
    status,
    finalLevel,
    totalDays
  );
};

export const cancelLeave = async (leaveRequestId: number) => {
  const leaveRequest = await helpers.validateEntity(
    repositories.leaveRequest.getLeaveRequestById,
    leaveRequestId,
    'Leave request not found'
  );

  await repositories.leaveRequest.updateLeaveRequestStatus(leaveRequestId, LeaveStatus.CANCELLED);

  if (leaveRequest.status === LeaveStatus.APPROVED) {
    const year = new Date(leaveRequest.startDate).getFullYear();
    await helpers.processBalanceUpdate(leaveRequest.userId, leaveRequest.leaveTypeId, year, leaveRequest.totalDays, false);
  }

  return { success: true, message: 'Leave request cancelled successfully' };
};

export const getIncomingRequests = async (userId: number) => {
  const user = await repositories.user.getUserById(userId);
  return user ? repositories.leaveRequest.getIncomingRequests(userId, user.role) : [];
};

const finalizeApproval = async (
  requestId: number,
  userId: number,
  leaveTypeId: number,
  totalDays: number,
  startDate: Date
) => {
  await repositories.leaveRequest.updateLeaveRequestStatus(requestId, LeaveStatus.APPROVED);
  await helpers.processBalanceUpdate(userId, leaveTypeId, startDate.getFullYear(), totalDays, true);
  return { nextStep: 'Approved' };
};

export const approveLeave = async (requestId: number) => {
  const leaveRequest = await helpers.validateEntity(
    repositories.leaveRequest.getLeaveRequestById,
    requestId,
    'Leave request not found'
  );

  const { userId, leaveTypeId, status, totalDays, finalApprovalLevel, startDate } = leaveRequest;

  if (totalDays == null) throw new Error('Total days not calculated');

  const parsedStartDate = new Date(startDate);

  if (leaveTypeId === 6 && status !== LeaveStatus.APPROVED) {
    return finalizeApproval(requestId, userId, leaveTypeId, totalDays, parsedStartDate);
  }

  const approvalFlow: Record<string, () => Promise<any>> = {
    [LeaveStatus.PENDING]: () => finalizeApproval(requestId, userId, leaveTypeId, totalDays, parsedStartDate),
    [LeaveStatus.PENDING_L1]: async () => {
      await repositories.leaveRequest.updateLeaveRequestStatus(requestId, LeaveStatus.PENDING_L2);
      return { nextStep: 'Approved (L2)' };
    },
    [LeaveStatus.PENDING_L2]: async () => {
      if (finalApprovalLevel === 3) {
        await repositories.leaveRequest.updateLeaveRequestStatus(requestId, LeaveStatus.PENDING_L3);
        return { nextStep: 'Approved (L3)' };
      }
      return finalizeApproval(requestId, userId, leaveTypeId, totalDays, parsedStartDate);
    },
    [LeaveStatus.PENDING_L3]: () => finalizeApproval(requestId, userId, leaveTypeId, totalDays, parsedStartDate)
  };

  return approvalFlow[status] ? approvalFlow[status]() : { message: 'Leave already processed' };
};

export const rejectLeave = async (requestId: number) => {
  await helpers.validateEntity(repositories.leaveRequest.getLeaveRequestById, requestId, 'Leave request not found');
  await repositories.leaveRequest.updateLeaveRequestStatus(requestId, LeaveStatus.REJECTED);
  return { success: true, message: 'Leave request rejected successfully' };
};

export const addLeaveType = async (name: string, maxPerYear: number, multiApprover = 1) => {
  const leaveType = await repositories.leaveType.createLeaveType(name, maxPerYear, multiApprover);
  const users = await repositories.user.getAllUsers();
  const year = new Date().getFullYear();

  await Promise.all(users.map(user =>
    repositories.leaveBalance.createOrInitLeaveBalance(user.id, leaveType.id, year, maxPerYear)
  ));

  return leaveType;
};

export const updateLeaveType = (id: number, name: string, maxPerYear: number, multiApprover = 1) =>
  repositories.leaveType.updateLeaveType(id, name, maxPerYear, multiApprover);

export const deleteLeaveType = (id: number) =>
  repositories.leaveType.deleteLeaveType(id);
