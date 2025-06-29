import { AppDataSource } from '../config/db';
import { User } from '../entities/User';
import { LeaveType } from '../entities/LeaveType';
import { LeaveBalance } from '../entities/LeaveBalance';
import bcrypt from 'bcrypt';
import { UserRole } from '../enums/UserRole';

const userRepo = AppDataSource.getRepository(User);
const leaveTypeRepo = AppDataSource.getRepository(LeaveType);
const leaveBalanceRepo = AppDataSource.getRepository(LeaveBalance);

const users: Array<{
  name: string;
  email: string;
  password: string;
  role: string;
  managerId: number | null;
  createdAt: Date;
}> = [
    {
      name: 'admin1',
      email: 'admin1@gmail.com',
      password: 'admin1password',
      role: 'admin',
      managerId: null,
      createdAt: new Date('2025-04-18T10:56:42'),
    },
    {
      name: 'hr1',
      email: 'hr1@gmail.com',
      password: 'hr1password',
      role: 'hr',
      managerId: 1,
      createdAt: new Date('2025-04-21T15:09:55'),
    },
    {
      name: 'manager1',
      email: 'manager1@gmail.com',
      password: 'manager1password',
      role: 'manager',
      managerId: 2,
      createdAt: new Date('2025-04-16T17:59:21'),
    },
    {
      name: 'manager2',
      email: 'manager2@gmail.com',
      password: 'manager2password',
      role: 'manager',
      managerId: 2,
      createdAt: new Date('2025-04-17T09:30:20'),
    },
    {
      name: 'employee1',
      email: 'employee1@gmail.com',
      password: 'employee1password',
      role: 'employee',
      managerId: 3,
      createdAt: new Date('2025-04-16T18:02:02'),
    },
    {
      name: 'employee2',
      email: 'employee2@gmail.com',
      password: 'employee2password',
      role: 'employee',
      managerId: 4,
      createdAt: new Date('2025-04-17T09:32:48'),
    },
  ];
  

export default async function seedUsers(): Promise<void> {
  const existingUsers = await userRepo.find();
  if (existingUsers.length > 0) {
    console.log('Users already exist. Skipping users seeding...');
    return;
  }

  const savedUsersMap: Record<string, User> = {};

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);

    const manager = u.managerId
      ? await userRepo.findOneBy({ id: u.managerId })
      : null;

    const user = userRepo.create({
      name: u.name,
      email: u.email,
      password: hashedPassword,
      role: u.role as UserRole,
      manager,
      createdAt: u.createdAt,
    });

    const savedUser = await userRepo.save(user);
    savedUsersMap[savedUser.email] = savedUser;
  }

  const leaveTypes = await leaveTypeRepo.find();
  const currentYear = new Date().getFullYear();

  const allUsers = await userRepo.find();

  for (const user of allUsers) {
    const balances = leaveTypes.map((lt) =>
      leaveBalanceRepo.create({
        userId: user.id,
        leaveTypeId: lt.id,
        year: currentYear,
        balance: lt.maxPerYear,
        used: 0,
      })
    );
    await leaveBalanceRepo.save(balances);
  }

  console.log('User data and leave balances seeded successfully!');
}
