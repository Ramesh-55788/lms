import { AppDataSource } from '../config/db';
import { LeaveType } from '../entities/LeaveType';
import { LeaveRequest } from '../entities/LeaveRequest';

const leaveTypeRepo = AppDataSource.getRepository(LeaveType);

export const getAllLeaveTypes = async (): Promise<LeaveType[]> => {
  return leaveTypeRepo.find({
    where: { isDeleted: false },
  });
};

export const getLeaveTypeById = async (id: number): Promise<LeaveType | null> => {
  return leaveTypeRepo.findOne({
    where: { id, isDeleted: false },
  });
};

export const createLeaveType = async (
  name: string,
  maxPerYear: number,
  multiApprover: number = 1
): Promise<LeaveType> => {
  const leaveType = leaveTypeRepo.create({ name, maxPerYear, multiApprover });
  return leaveTypeRepo.save(leaveType);
};

export const updateLeaveType = async (
  id: number,
  name: string,
  maxPerYear: number,
  multiApprover: number = 1
): Promise<LeaveType | null> => {
  const leaveType = await leaveTypeRepo.findOne({
    where: { id, isDeleted: false },
  });
  if (!leaveType) return null;
  leaveType.name = name;
  leaveType.maxPerYear = maxPerYear;
  leaveType.multiApprover = multiApprover;
  return leaveTypeRepo.save(leaveType);
};

export const deleteLeaveType = async (id: number): Promise<boolean> => {
  const result = await leaveTypeRepo.update(
    { id, isDeleted: false },
    { isDeleted: true }
  );

  if (result.affected !== 0) {
    await AppDataSource.createQueryBuilder()
      .update(LeaveRequest)
      .set({ isDeleted: true })
      .where('leaveTypeId = :id', { id })
      .execute();
    return true;
  }

  return false;
};
