import { AppDataSource } from '../config/db';
import { LeaveType } from '../entities/LeaveType';

const leaveTypeRepo = AppDataSource.getRepository(LeaveType);

const leaveTypes = [
  { id: 1, name: 'Casual Leave', maxPerYear: 10, multiApprover: 1 },
  { id: 2, name: 'Sick Leave', maxPerYear: 14, multiApprover: 1 },
  { id: 3, name: 'Paid Leave', maxPerYear: 16, multiApprover: 2 },
  { id: 4, name: 'Maternity Leave', maxPerYear: 20, multiApprover: 3 },
  { id: 5, name: 'Paternity Leave', maxPerYear: 20, multiApprover: 3 },
  { id: 6, name: 'Emergency Leave', maxPerYear: 15, multiApprover: 0 },
  { id: 7, name: 'Loss of Pay', maxPerYear: 20, multiApprover: 1 }
];

async function seedLeaveTypes(): Promise<void> {
  const existingLeaveTypes = await leaveTypeRepo.find();

  if (existingLeaveTypes.length === 0) {
    for (const leave of leaveTypes) {
      const leaveType = leaveTypeRepo.create(leave);
      await leaveTypeRepo.save(leaveType);
    }
    console.log('Leave Types data seeded successfully!');
  } else {
    console.log('Data already exist. Skipping Leave Types seeding...');
  }
}

export default seedLeaveTypes;
