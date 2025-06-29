import cron from 'node-cron';
import { AppDataSource } from '../config/db';
import { LeaveType } from '../entities/LeaveType';
import { LeaveBalance } from '../entities/LeaveBalance';

const leaveTypeRepo = AppDataSource.getRepository(LeaveType);
const leaveBalanceRepo = AppDataSource.getRepository(LeaveBalance);

async function carryForwardLeaves(): Promise<void> {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const leaveTypes = await leaveTypeRepo.find();
  const validTypes = leaveTypes.filter(
    (lt) => lt.id !== 4 && lt.id !== 5 && lt.id !== 6 && lt.id !== 7
  );

  for (const type of validTypes) {
    const previousBalances = await leaveBalanceRepo.find({
      where: {
        leaveTypeId: type.id,
        year: previousYear,
      },
    });

    for (const bal of previousBalances) {
      const unused = bal.balance;
      if (unused <= 0) continue;

      const carry = Math.min(unused, type.maxPerYear);

      const existingCurrent = await leaveBalanceRepo.findOne({
        where: {
          leaveTypeId: type.id,
          userId: bal.userId,
          year: currentYear,
        },
      });

      if (!existingCurrent) {
        await leaveBalanceRepo.save({
          userId: bal.userId,
          leaveTypeId: type.id,
          year: currentYear,
          balance: carry,
          used: 0,
        });
      } else {
        console.log(
          `Already exists for user ${bal.userId} and leave type ${type.id}, skipping.`
        );
      }
    }
  }

  console.log('Carry-forward process completed.');
}

function runCarryForwardJob(): void {
  cron.schedule('0 0 1 1 *', async () => {
    console.log('Running yearly carry-forward job...');
    await carryForwardLeaves();
  });
}

export default runCarryForwardJob;
