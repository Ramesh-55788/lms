import { AppDataSource } from '../config/db';
import { LeaveBalance } from '../entities/LeaveBalance';

const leaveBalanceRepo = AppDataSource.getRepository(LeaveBalance);

export const getLeaveBalanceByUserAndYear = async (
  userId: number,
  year: number
) => {
  return await leaveBalanceRepo
    .createQueryBuilder('lb')
    .leftJoinAndSelect('lb.leaveType', 'lt')
    .where('lb.userId = :userId', { userId })
    .andWhere('lb.year = :year', { year })
    .andWhere('lb.isDeleted = false')
    .andWhere('lt.isDeleted = false')
    .getMany();
};

export const updateLeaveBalance = async (
  id: number,
  balance: number,
  used: number
) => {
  const leaveBalance = await leaveBalanceRepo.findOne({
    where: { id, isDeleted: false },
  });
  if (!leaveBalance) return null;

  leaveBalance.balance = Number(balance);
  leaveBalance.used = Number(used);

  return await leaveBalanceRepo.save(leaveBalance);
};

export const updateLeaveBalanceByUserAndType = async (
  userId: number,
  leaveTypeId: number,
  year: number,
  balanceChange: number,
  usedChange: number
) => {
  const leaveBalance = await leaveBalanceRepo.findOne({
    where: { userId, leaveTypeId, year, isDeleted: false },
  });

  if (!leaveBalance) return null;

  leaveBalance.balance += Number(balanceChange);
  leaveBalance.used += Number(usedChange);

  return await leaveBalanceRepo.save(leaveBalance);
};

export const createLeaveBalance = async (
  userId: number,
  leaveTypeId: number,
  year: number,
  balance: number,
  used: number = 0
) => {
  const leaveBalance = leaveBalanceRepo.create({
    userId,
    leaveTypeId,
    year,
    balance,
    used,
  });

  return await leaveBalanceRepo.save(leaveBalance);
};

export const createOrInitLeaveBalance = async (
  userId: number,
  leaveTypeId: number,
  year: number,
  balance: number = 0
) => {
  const existing = await leaveBalanceRepo.findOne({
    where: { userId, leaveTypeId, year, isDeleted: false },
  });

  if (!existing) {
    const leaveBalance = leaveBalanceRepo.create({
      userId,
      leaveTypeId,
      year,
      balance,
      used: 0,
    });
    await leaveBalanceRepo.save(leaveBalance);
  }
};
