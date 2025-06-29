import { AppDataSource } from '../config/db';
import { User } from '../entities/User';
import { LeaveType } from '../entities/LeaveType';
import { LeaveBalance } from '../entities/LeaveBalance';
import { UserRole } from '../enums/UserRole';

const userRepo = AppDataSource.getRepository(User);
const leaveTypeRepo = AppDataSource.getRepository(LeaveType);
const leaveBalanceRepo = AppDataSource.getRepository(LeaveBalance);

export const getAllUsers = async (): Promise<User[]> => {
  return userRepo.find({ where: { isDeleted: false } });
};

export const createUser = async (
  name: string,
  email: string,
  password: string,
  role: UserRole,
  managerId: number | null = null
): Promise<User> => {
  const user = userRepo.create({
    name,
    email,
    password,
    role,
    managerId,
  } as Partial<User>);

  const savedUser = await userRepo.save(user);

  const leaveTypes = await leaveTypeRepo.find({ where: { isDeleted: false } });

  const currentYear = new Date().getFullYear();
  const leaveBalances = leaveTypes.map((lt) =>
    leaveBalanceRepo.create({
      userId: savedUser.id,
      leaveTypeId: lt.id,
      year: currentYear,
      balance: lt.maxPerYear,
      used: 0,
    })
  );

  await leaveBalanceRepo.save(leaveBalances);

  return savedUser;
};

export const softDeleteUser = async (id: number): Promise<boolean> => {
  const user = await userRepo.findOne({ where: { id, isDeleted: false } });
  if (!user) return false;
  user.isDeleted = true;
  await userRepo.save(user);
  return true;
};

export const updateManagerForUser = async (
  userId: number,
  newManagerId: number | null
): Promise<User | null> => {
  const user = await userRepo.findOne({ where: { id: userId, isDeleted: false } });
  if (!user) return null;

  const newManager = newManagerId
    ? await userRepo.findOne({ where: { id: newManagerId, isDeleted: false } })
    : null;

  user.manager = newManager;
  return userRepo.save(user);
};


export const getUserByEmail = async (email: string): Promise<User | null> => {
  return userRepo.findOne({ where: { email, isDeleted: false } });
};

export const getUserById = async (id: number): Promise<User | null> => {
  return userRepo.findOne({ where: { id, isDeleted: false } });
};

export const getDelUsers = async (
  limit: number = 10,
  offset: number = 0
): Promise<User[]> => {
  return userRepo.find({
    where: { isDeleted: true },
    take: limit,
    skip: offset,
  });
};
