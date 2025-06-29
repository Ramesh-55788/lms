import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../entities/User';
import { LeaveType } from '../entities/LeaveType';
import { LeaveBalance } from '../entities/LeaveBalance';
import { LeaveRequest } from '../entities/LeaveRequest';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [User, LeaveType, LeaveBalance, LeaveRequest],
  migrations: ['backend/migrations/**/*.ts'],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection successfully established');
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  }
};
