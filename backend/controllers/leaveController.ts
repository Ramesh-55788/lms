import { Request, Response, NextFunction } from 'express';
import * as leaveModel from '../models/leaveModel';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    });
  };
};

const parseId = (value: string): number => parseInt(value);

// Fetch users on leave today
export const fetchUsersOnLeaveToday = asyncHandler(async (req, res) => {
  const users = await leaveModel.getUsersOnLeaveToday();
  if (users.length === 0) {
    res.status(204).json({ message: 'No users are on leave today.' });
    return;
  }
  res.json({ count: users.length, users });
});

// Fetch team leave
export const fetchTeamLeave = asyncHandler(async (req, res) => {
  const { teamMembers, month, year } = req.query;

  if (!teamMembers || !month || !year) {
    res.status(400).json({ error: 'Missing teamMembers, month, or year' });
    return;
  }

  const userIdArray = String(teamMembers)
    .split(',')
    .map((id) => parseId(id.trim()))
    .filter((id) => !isNaN(id));

  const role = (req as any).user.role;

  const leaveRequests = await leaveModel.getTeamLeave(userIdArray, Number(month), Number(year), role);

  res.json(leaveRequests); 
});

// Fetch leave balance
export const fetchLeaveBalance = asyncHandler(async (req, res) => {
  const userId = parseId(req.params.userId);
  const currentYear = new Date().getFullYear();
  const balance = await leaveModel.getLeaveBalance(userId, currentYear);

  if (balance.length === 0) {
    res.status(404).json({ error: 'No leave balance found for the current year.' });
    return;
  }

  let totalBalance = 0;
  let totalLeaves = 0;

  const leaveDetails = balance.map(({ leaveTypeId, balance, used, leaveType }) => {
    const isSpecial = leaveTypeId === 9 || leaveTypeId === 10;
    const total = balance + used;
    if (!isSpecial) {
      totalBalance += balance;
      totalLeaves += total;
    }
    return { leave_type: leaveType.name, total, balance, used };
  });

  res.json({ totalBalance, totalLeaves, leaveDetails });
});

// Fetch leave types
export const fetchLeaveTypes = asyncHandler(async (req, res) => {
  const leaveTypes = await leaveModel.getLeaveTypes();
  if (!leaveTypes.length) {
    res.status(404).json({ error: 'No leave types found.' });
    return;
  }
  res.json(leaveTypes);
});

// Request leave
export const requestLeaveHandler = asyncHandler(async (req, res) => {
  const { leaveTypeId, startDate, endDate, isHalfDay, halfDayType, reason, totalDays } = req.body;
  const userId = parseInt(req.body.userId);
  const result = await leaveModel.requestLeave(userId, leaveTypeId, startDate, endDate, isHalfDay, halfDayType, reason, totalDays);
  res.status(201).json({ message: 'Leave requested successfully', insertId: result.insertId });
});

// Get leave history
export const getLeaveHistoryHandler = asyncHandler(async (req, res) => {
  const userId = parseId(req.params.userId);
  const leaveHistory = await leaveModel.getLeaveHistory(userId);
  res.json({ leaveHistory });
});

// Cancel leave
export const cancelLeaveHandler = asyncHandler(async (req, res) => {
  const leaveRequestId = parseId(req.params.leaveRequestId);
  await leaveModel.cancelLeave(leaveRequestId);
  res.json({ message: 'Leave canceled successfully' });
});

// Incoming requests
export const getIncomingRequestsHandler = asyncHandler(async (req, res) => {
  const userId = parseId(req.params.userId);
  const requests = await leaveModel.getIncomingRequests(userId);
  res.json({ incomingRequests: requests });
});

// Approve leave
export const approveLeaveHandler = asyncHandler(async (req, res) => {
  const requestId = parseId(req.params.approveId);
  const result = await leaveModel.approveLeave(requestId);
  res.json({ message: 'Leave approval processed', result });
});

// Reject leave
export const rejectLeaveHandler = asyncHandler(async (req, res) => {
  const rejectId = parseId(req.params.rejectId);
  const result = await leaveModel.rejectLeave(rejectId);
  res.json({ message: 'Leave rejected', result });
});

// Create leave type
export const createLeaveHandler = asyncHandler(async (req, res) => {
  const { name, maxPerYear, multiApprover } = req.body;
  const result = await leaveModel.addLeaveType(name, maxPerYear, multiApprover);
  res.json({ message: 'Leave type added successfully', result });
});

// Update leave type
export const updateLeaveHandler = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { name, maxPerYear, multiApprover } = req.body;
  const result = await leaveModel.updateLeaveType(id, name, maxPerYear, multiApprover);
  res.json({ message: 'Leave type updated successfully', result });
});

// Delete leave type
export const deleteLeaveHandler = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const result = await leaveModel.deleteLeaveType(id);
  res.json({ message: 'Leave type deleted successfully', result });
});
